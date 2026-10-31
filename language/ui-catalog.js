import {actionEnglish} from './action-catalog.js';
// Interface copy is separate from engine state, deck data and card definitions.
export const english={...actionEnglish,...Object.fromEntries(`
非官方社群開發專案 · 線上對戰	Unofficial community project · Online play
進階：匯入牌組	Advanced: import a deck
自創牌組可在「編輯牌組」儲存後，重新整理此頁。	Save custom decks in “Build a deck”, then refresh this page.
教學對手	Tutor
點高亮格子或目標	Choose a highlighted square or target
· 席位	· Seat
Firebase 拒絕房間存取，請確認登入身分與房間權限。	Firebase denied room access. Check your sign-in and room permissions.
Firebase 重新連線中，請稍候。	Reconnecting to Firebase. Please wait.
請先使用 Google 登入。	Sign in with Google first.
登入身分已變更，請重新使用 Google 登入。	Your account changed. Sign in with Google again.
暫時無法建立房間，請再試一次。	Unable to create a room right now. Please try again.
此裝置沒有這個房間的席位權限	This account has no seat in this room
這個裝置沒有已保留的席位	This device has no reserved seat
房間不存在或已過期	The room does not exist or has expired
房間已滿或對局已開始	The room is full or the match has started
房間已滿或加入已取消	The room is full or joining was cancelled
Google 登入	Google sign-in
使用 Google 登入	Continue with Google
正在準備登入…	Preparing sign-in…
請先使用 Google 登入	Sign in with Google to continue
已登入 Google	Signed in with Google
登出	Sign out
已登出	Signed out
Google 玩家	Google player
登入後即可建立或加入房間。同一個 Google 帳號可在其他裝置恢復原本席位。	Sign in to create or join a room. The same Google account can resume its seat on another device.
建立房間，邀請另一位玩家。雙方準備後，進入正式戰場。雙方離線超過 15 分鐘的房間會自動清除。	Create a room and invite another player. Enter the full battlefield when both players are ready. Rooms are removed after both players have been offline for over 15 minutes.
連接對戰服務	Connect to match service
恢復我的席位	Resume my seat
官方 BETA 與本機牌組	Official BETA and local decks
已取得專屬席位，請選擇牌組。	Your seat is reserved. Choose a deck.
等待／離線	Waiting / offline
對手已選擇牌組	Opponent selected a deck
請先上傳牌組	Select a deck first
重新連線中…	Reconnecting…
同步中…	Syncing…
對手離線，等待重連	Opponent offline; waiting
已連線	Connected
玩家 1	Player 1
玩家 2	Player 2
這個裝置沒有此房間的席位，請回線上大廳加入。	This device has no seat in this room. Join from the online lobby.
線上房間	Online room
加入房間	Join room
線上對戰測試版：可建立房間、交換牌組並進行同步對局。目前使用簡易對局介面，正式戰場介面尚未接入。	Online battle beta: create rooms, exchange decks and play a synchronized match. This currently uses a basic match interface; the full battlefield interface is not connected yet.
建立房間，邀請另一位玩家。	Create a room and invite another player.
測試版	Beta
領域，靜候你的到來	THE REALM AWAITS
單機雙人	Local two-player
單人 VS 電腦	Solo vs AI
線上對戰	Online battle
編輯牌組	Build a deck
與身旁的對手，共用一片領域。	Share the realm with a rival beside you.
獨自踏入領域，挑戰灰燼賢者。	Enter the realm and challenge the Ashen Sage.
與遠方的術士交鋒。	Face sorcerers from distant realms.
編織法術，構築屬於你的力量。	Weave your spells. Shape your power.
製作中	Coming soon
目前仍在製作中	Currently in development
線上對戰尚未開放，敬請期待。	Online battles are still in development. Stay tuned.
繼續上次對局	Continue your match
· 席	· Seat
北	North
東	East
南	South
西	West
詳	Info
剩餘	remaining
加入	Join
卡堆	Card pile
失敗：	Failed: 
對局已鎖定 · 房間	Match locked · Room
對局	Match
席	Seat
尚無紀錄	No events yet
就緒。	Ready.
已上傳：	Uploaded: 
已用	Spent
已連接 · 路人清房掃掉	Connected · Removed expired rooms: 
已連接。正在順便清理雙離線超過 15 分鐘的房間	Connected. Cleaning rooms where both players have been offline for over 15 minutes
已連接（清房略過：	Connected (room cleanup skipped: 
已連接，可建立或加入房間（目前沒有可清的過期房）	Connected. You can create or join a room (no expired rooms to clean)
張（內容隱藏）	cards (contents hidden)
內容隱藏	contents hidden
抽取一張	draws a
採官方	Uses the official
搜尋卡名或規則文字	Search card names or rules text
支付	Pay
施放	Cast
施法	Cast
最多	Up to
此房尚未開始對局（status	This room has not started a match (status
牌組煙霧	Deck smoke test
煙霧	Smoke test
目標	Target
空手	Empty hand
繼續效果選擇	Continue effect choices
被控玩家所有卡牌	Controlled player’s cards
被控玩家所有牌（唯讀）	Controlled player’s cards (read only)
請硬重整	Please reload without cache
貼上官方 JSON、文字牌表或網址	Paste official JSON, a text decklist or a URL
載入卡牌	Loading cards
進入；重整後可重放 action。	Enter; actions can be replayed after reloading.
選單	Menu
選擇	Choose
間：	rooms: 
現在不是你的回合	It is not your turn
此單位已橫置	This unit is tapped
召喚失調或 Disabled	Summoning sickness or Disabled
這張卡牌的效果尚未實作	This card’s effect is not implemented
位置、目標、施法者或目前階段不合法	The location, target, caster or current phase is not legal

地點	Sites
法術	Spells
放置	plays
目前階級	Current level
正在載入官方／自創牌組…	Loading official and saved decks…
介面語言 / Language	Language / 語言
介面語言	Interface language
語言 / Language	Language / 語言
跟隨裝置	Follow device
繁體中文	繁體中文
目前語言	Current language
裝置語言	Device language
自動選擇繁體中文或英文；手動設定會保留在此裝置。	Automatically use Traditional Chinese or English. Your manual choice is saved on this device.
無法儲存語言偏好；本次設定仍然有效。	Could not save your language preference. It still applies to this session.
主要導覽	Main navigation
對戰領域	Battlefield
卡牌圖書館	Card library
我的牌組	My decks
操作說明	How to play
實作進度	Implementation status
規則測試	Rules tests
本機離線引擎	Local offline engine
正在展開領域，讀取本機卡牌資料…	Loading the realm and local card data…
非官方社群開發專案 · Sorcery	Unofficial community project · Sorcery
在卡牌之間，開拓你的領域。	Build your realm, one card at a time.
開始對戰 →	Start match →
開始對戰	Start match
繼續對局	Resume match
探索卡牌	Explore cards
遊戲大廳	Game lobby
大廳	Lobby
對戰	Play
牌組	Decks
圖鑑	Cards
遊戲導覽	Game navigation
遊戲工具	Game tools
對局選單	Match menu
新對局	New match
紀錄	Log
對戰紀錄	Battle log
玩家資訊	Player information
雙方玩家	Both players
對局資訊	Match information
目前來源	Mana sources
已花費	Spent
可用法力	Available mana
元素門檻	Elemental thresholds
牌庫／墓地	Libraries / cemetery
生命	Life
死亡之門	Death’s Door
手牌	Hand
對手隱藏手牌	Opponent’s hidden hand
張手牌公開	 cards revealed
對手手牌	Opponent’s hand
公開	Revealed
對手思考中	Opponent is thinking
對手行動	Opponent action
等待對手回應	Waiting for opponent’s response
等待對手完成操作。	Wait for your opponent to finish.
灰燼賢者 · AI	Ashen Sage · AI
玩家二	Player 2
玩家	Player
你	You
對手	Opponent
的地點	’s site
無主地點	Uncontrolled site
法力	Mana
魔力	Mana
力量	Power
傷害	Damage
門檻	Threshold
可行動	Ready
失能	Disabled
已橫置	Tapped
未橫置	Untapped
召喚失調	Summoning sickness
冰封	Frozen
乘坐	Riding
攜帶者：	Bearer: 
攜帶中	Carried
地表	Surface
表面及下層	Surface and below
表面／虛空	Surface / void
地下／水下施法	Casting underground / underwater
地下／水下	Underground / underwater
水下	Underwater
地下	Underground
下層	Below
表面	Surface
同一單位	Same unit
戰場縮圖	Battlefield minimap
領域戰場	Realm battlefield
戰場中央	Battlefield center
戰場	Battlefield
放大戰場	Zoom in
縮小戰場	Zoom out
恢復預設視角	Reset view
回到自己的 Avatar	Focus your Avatar
上方有可操作的格子	An available square is above
下方有可操作的格子	An available square is below
左方有可操作的格子	An available square is to the left
右方有可操作的格子	An available square is to the right
滑動瀏覽 · 點擊查看詳情 · 向上拖曳出牌	Swipe to browse · Tap for details · Drag up to play
手牌 0 · 展開	Hand 0 · Expand
收起	Collapse
展開	Expand
展開地表卡堆	Expand surface cards
展開地下卡堆	Expand underground cards
展開水下卡堆	Expand underwater cards
展開下層卡堆	Expand cards below
卡牌堆疊	Cards at this location
置頂	Bring to front
置頂只調整展示順序。切換上下層請選單位後使用合法移動。	Bringing a card to the front only changes its display order. Select a unit and use a legal move to change layers.
這一層沒有單位。	There are no units in this layer.
卡牌	Card
費用	Cost
目前階級：	Current level: 
目前階級	Current level
下一次升級所需的印刷費用：	Next printed cost required: 
已達 8 級，化身須獨處此位置。	Level 8 reached. An Avatar must be alone at this location.
此牌沒有額外規則文字。	This card has no additional rules text.
關閉卡牌詳情	Close card details
關閉	Close
暫時關閉	Close for now
資訊	Information
提示	Notice
選擇行動	Choose an action
選擇此牌	Select this card
施放此牌	Cast this card
選為目標	Select as target
選擇此位置	Choose this location
查看能力	View abilities
目前無法操作	Unavailable now
目前無合法操作	No legal actions
目前沒有合法的出牌方式。	There is no legal way to play this card now.
此單位目前沒有合法行動。	This unit has no legal actions now.
此單位無法回應目前的攻擊。	This unit cannot respond to the current attack.
對局已更新，請重新選擇卡牌。	The match has changed. Select the card again.
選擇目標	Choose a target
點金色格子或目標	Choose a highlighted square or target
點選高亮處	Choose a highlighted target
點選戰場	Choose on the battlefield
在戰場選擇	Choose on battlefield
查看選項	View options
查看來源卡牌：	View source card: 
選擇下方目標，或按「在戰場選擇」收起視窗後點選高亮格子。	Choose a target below, or select “Choose on battlefield” and tap a highlighted square.
關閉只收起視窗，不會自動取消或略過。可由戰場的「查看選項」繼續。	Closing this window does not cancel or skip the effect. Use “View options” on the battlefield to continue.
效果選擇	Effect choices
效果結算。	Effect resolves.
效果結算	Resolving an effect
是否執行效果	Resolve this effect?
可以執行或略過這項效果。	You may resolve or skip this effect.
執行效果	Resolve effect
略過	Skip
目前法力不足，只能略過。	Not enough mana. You can only skip.
選擇後繼續結算效果。	Choose an option to continue resolving the effect.
下面的數字是要打在框起來的那隻單位身上的傷害。	Choose how much damage to assign to the outlined unit.
需要真人依實際操作或卡牌類別回報；程式與 AI 不會代填結果。尚未完成實體操作時，請保留此選擇並稍後繼續。	A player must report the physical result or card classification. The game and AI will not supply it. Leave this choice pending until that action is complete.
搜尋要命名的法術	Search for a spell to name
輸入卡牌名稱	Enter a card name
沒有符合的法術名稱。	No matching spell names.
未找到（仍洗牌）	Fail to find (still shuffle)
選擇要找出的卡牌，或選擇未找到。	Choose a card to find, or choose to fail to find.
搜尋	Search
取消施放（不支付費用）	Cancel casting (pay nothing)
取消啟動（不支付費用）	Cancel activation (pay nothing)
取消	Cancel
開局重抽	Opening mulligan
起始手牌	Opening hand
開局	Opening
你是先手，第一回合不抽牌。	You go first and skip your first turn’s draw.
你是後手，第一回合開始時選一個牌庫抽 1 張。	You go second. Choose a library to draw one card at the start of your first turn.
最多重抽 3 張。點選順序決定放到各自牌庫底的先後；取消再點可重新排序。	You may redraw up to 3 cards. Selection order sets their order on the bottom of each library. Deselect and select again to reorder.
從 Spellbook 抽 7 張；沒有 Atlas。	Draw 7 cards from your Spellbook; you have no Atlas.
從 Spellbook 抽 3 張；起手不抽地點。	Draw 3 cards from your Spellbook and no starting sites.
保留手牌，開始對局	Keep hand and begin
未選取重抽卡牌	No cards selected for redraw
選擇重抽	Select for redraw
取消重抽	Deselect redraw
檢視起始手牌	Review opening hand
重抽	Redraw
回合開始	Start of turn
選擇抽牌的牌庫	Choose a library to draw from
抽取一張牌後進入主要階段。關閉視窗不會代你選擇。	Draw one card to enter your main phase. Closing this window will not choose for you.
選擇抽牌	Choose a library
抽取地點	Draw a site
抽取法術	Draw a spell
抽牌	Draw
主要階段	Main phase
主要	Main
開始	Start
優先	Priority
回應中	Responding
回應	Response
強制動作 · 先移動並攻擊	Required action · Move and attack first
對局結束	Match over
已結束	Finished
等待選擇	Waiting for a choice
請完成效果選擇	Complete the effect choice
結束回合	End turn
行動	Action
讓過	Pass
不攔截，讓它進入	Do not intercept; let it enter
攔截完成，開始結算	Finish interception and resolve
不防禦，開始結算	Do not defend; resolve combat
防禦完成，開始結算	Finish defending and resolve
防禦／攔截	Defend / intercept
防禦方式	Defense options
一位防禦者只能保護同時被攻擊的其中一位單位。	A defender can protect only one of the units being attacked simultaneously.
選擇要保護的單位	Choose a unit to protect
可以加入防禦，或代替原本的防禦目標。	can join the defense or replace the original defender.
加入防禦，保留原目標	Join the defense; keep original target
代替原目標防禦	Replace the original defender
這個單位目前無法防禦。	This unit cannot defend now.
同時攻擊	Simultaneously attacking
正在攻擊	is attacking
正在進入	is entering
可以攔截	can be intercepted
已加入攔截：	Interceptors: 
一起防禦	Defend together with
代替防禦	Defend instead of
加入防禦（保留原目標）	Join defense (keep original target)
加入防禦	Join defense
防禦	Defense
攔截	Interception
移動 / 攻擊	Move / attack
遠程射擊。	Ranged attack.
遠程射擊	Ranged attack
移動至	moves to
移動	Move
攻擊	Attack
橫置 · 抽地點	Tap · Draw a site
橫置 · 抽法術	Tap · Draw a spell
點選高亮位置可移動或攻擊，也可橫置抽牌。	Choose a highlighted location to move or attack, or tap to draw a card.
橫置：推動 Rolling Boulder	Tap: Push Rolling Boulder
橫置：獲得 1 法力	Tap: Gain 1 mana
橫置：解救	Tap: Free
橫置	Tap
揭示手牌	Reveal hand
棄牌招募	Discard to hire
能力來源已失效	The ability source is no longer available
啟動能力。	activates an ability.
能力	Ability
攜帶中	Carried
攜帶	Carry
保管	Custody
拾取物品	Pick up items
放下物品	Drop items
超過可攜帶的單位數量	Too many carried units
選擇單位	Choose units
專屬法術	Bound spells
由指定施法者保管，與手牌分開。	Kept by the designated spellcaster, separately from your hand.
目前沒有專屬法術	No bound spells
牌庫頂	Top of library
牌庫已空	The library is empty
從牌庫頂施放	Cast from the top of the library
雙方墓地	Both cemeteries
墓地	Cemetery
從墓地施放	Cast from cemetery
裝備給	Equip to
選擇施法者	Choose a spellcaster
施法起點	Casting origin
地下／水下施法	Casting underground / underwater
從手牌召喚	Summon from hand
犧牲 Skeleton 復活	Sacrifice a Skeleton to return
犧牲	Sacrifice
隨機棄牌	Random discard
生命支付	Pay life
少付 1	Pay 1 less
另需	Also requires
法力召喚費用	summoning mana cost
完成進場效果後移除	Remove after resolving entry effects
選擇卡牌用途	Choose how to use this card
原本的卡牌	Original card
作為 Spirit 僕從施放	Cast as a Spirit minion
作為 Fireball 施放	Cast as Fireball
化為 Spirit	As a Spirit
化為 Fireball	As Fireball
複本	Copy
掠奪法術 · 忽略門檻	Plunder spell · Ignore thresholds
放逐原牌並施放暫時複本	Banish the original and cast a temporary copy
放逐	Banish
取代	Replace
變為	Transform into
攻城槌：撞向相鄰的 Wall 或 Monument	Battering Ram: Ram an adjacent Wall or Monument
投降	Concede
結束這場對局？	End this match?
投降後會記錄對手獲勝。	Conceding records your opponent as the winner.
確認投降	Confirm concession
領域已定	The realm is decided
取得領域	claims the realm
獲勝	wins
查看結果	View result
再戰一局	Play again
返回大廳	Return to lobby
儲存重播	Save replay
匯出重播	Export replay
對局動態	Battle update
即時對局動態	Live battle updates
回合	Turn
死亡	dies
受到	takes
點傷害。	damage.
來源：	Source: 
來源	Source
召喚進場。	enters the battlefield.
召喚	Summon
被放逐	is banished
返回手牌	returns to hand
送入墓地	is put into the cemetery
暫時離場	temporarily leaves the battlefield
本機儲存失敗，請使用匯出備份。	Local saving failed. Export a backup.
休戰 · 本回合不能攻擊對方的單位或地點	Truce · You cannot attack enemy units or sites this turn
交給	Pass to
點此看手牌	Tap to reveal hand
新牌組	New deck
載入牌組	Load deck
編輯我的牌組	Edit my decks
編織你的法術	Build your spellbook
選擇牌組	Choose a deck
官方 BETA 預組	Official Beta preconstructed decks
官方預組	Official precon
官方四元素預組	Official four-element precons
預設牌組	Preset decks
尚無儲存	No saved decks
儲存的牌組	Saved decks
儲存	Save
匯入牌組	Import deck
匯出牌組	Export deck
匯入中	Importing
匯入	Import
匯出	Export
清空	Clear
牌組名稱	Deck name
牌組內容	Deck contents
貼上官方 JSON、文字牌表或網址…	Paste official JSON, a text decklist or a URL…
支援：	Supported formats:
官方 JSON（含	Official JSON (including
官方／Curiosa 文字牌表	Official / Curiosa text decklists
牌組網址（CORS 失敗時請改貼 JSON／文字）	Deck URL (if CORS blocks it, paste JSON or text instead)
匯出官方 JSON	Export official JSON
複製文字牌表	Copy text decklist
文字牌表	Text decklist
已複製文字牌表	Text decklist copied
牌組已儲存在此瀏覽器。	Deck saved in this browser.
無法匯入：	Could not import: 
已匯入（警告：	Imported (warning: 
已匯入「	Imported “
我的自創牌組（尚無，請至本機「我的牌組」儲存）	My custom decks (none yet; save one in My decks)
我的自創牌組	My custom decks
點選卡牌查看詳情，再按「加入牌組」；手機可左右滑切換「所有牌」與「我的牌組」。卡圖缺少時以黑色卡面顯示。	Tap a card for details, then choose “Add to deck”. On phones, swipe between All cards and My deck. Missing artwork uses a black card face.
點選「所有牌」中的 Avatar 可更換	Choose an Avatar in All cards to replace it
點選卡牌時加入	Add selected cards to
加入牌組	Add to deck
更換 Avatar	Replace Avatar
所有牌	All cards
收藏區獨立於牌庫，供指定效果取用。	The collection is separate from your libraries and is used by specific effects.
收藏區	Collection
從收藏區移除	Remove from collection
轉為自組牌	Convert to custom deck
衍生自組	Custom adaptation
官方原表採 36／16 張數。變更卡牌後須轉為 60／30 自組牌，才能通過一般構築檢查。	The official list uses 36 / 16 cards. After editing it, convert to a 60 / 30 custom deck to use normal constructed validation.
通過目前牌組檢查（完整規則驗證待完成）	Passed current deck checks (full rules validation is pending)
衍生物不能加入牌組。	Tokens cannot be added to a deck.
已達稀有度張數上限。	The rarity copy limit has been reached.
設定 Unique Dragon	Set aside a Unique Dragon
設定 Dragon：	Set-aside Dragon: 
請選擇	Please choose
牌組編輯分頁	Deck editor tabs
左右滑動切換「所有牌」與「我的牌組」	Swipe between All cards and My deck
尚未加入卡牌	No cards added yet
增加	Increase
減少	Decrease
牌組內	In deck
尚未實作	Not implemented
可操作 · 部分支援	Playable · Partial support
衍生物 · 部分支援	Token · Partial support
篩選卡牌	Filter cards
篩選	Filter
搜尋卡名或規則文字…	Search card names or rules…
搜尋卡牌	Search cards
全部類型	All types
全部元素	All elements
全部費用	All costs
卡牌類型	Card type
元素	Element
僅可操作	Playable only
找不到符合條件的卡牌。	No cards match these filters.
本機官方資料庫	Local official card database
筆卡牌 · 搜尋、探索與檢視完整規則。	cards · Search, explore and inspect the full rules.
選擇你的領域	Choose your realm
你的牌組	Your deck
對手牌組	Opponent deck
遊戲模式	Game mode
單人 vs AI	Single player vs AI
本機雙人測試	Local two-player test
本機雙人	Local two-player
對 AI	vs AI
難度	Difficulty
易	Easy
中	Medium
強	Hard
全知搜尋（可偷看隱藏資訊；預設為公平）	Omniscient search (can see hidden information; fair play is the default)
進階設定	Advanced settings
隨機種子	Random seed
查看官方四副完整牌表	View all four official decklists
返回新對局	Back to match setup
載入牌組編輯器	Open in deck editor
官方原表：Avatar 1 · Spellbook 36 · Atlas 16	Official list: 1 Avatar · 36 Spellbook · 16 Atlas
官方文章與原始牌表	Official article and original decklists
官方牌表圖片	Official decklist image
依官方 2023 年原表逐張保留；缺少效果的原表尚未開放對局。	Preserves each card in the official 2023 lists. Lists with missing effects are not available for play.
牌表內卡牌已可操作；完整規則驗證仍待完成。	The listed cards are playable; complete rules validation is still pending.
尚未開放	Not available yet
尚缺	Missing
種卡牌效果，補齊後開放對局。	card effects; play becomes available when these are implemented.
開發狀態	Development status
這項資訊只在選單中，不佔用戰場。	This information is shown only in the menu.
筆官方資料，	official entries; 
張可操作，完整規則仍待驗證。	playable cards. Full rules validation is still pending.
特效：	Effects: 
開	On
關	Off
直接操作卡牌與戰場	Playing cards and using the battlefield
拖曳手牌到金色格子即可出牌。點一下卡牌會開啟詳情；按「選擇此牌」或「選擇行動」後，再點高亮位置。直接拖曳可執行移動與攻擊；點擊卡牌則先查看詳情。同一個位置有多種行動時會列出選項。	Drag a hand card to a gold square to play it. Tap a card for details, choose Select this card or Choose an action, then tap a highlighted location. You can also drag units to move or attack. If several actions are legal at one location, choose from the list.
手機預設顯示完整戰場；點卡堆可展開完整卡面。放大後，在空地上單指滑動來平移，雙指可縮放與平移。拖曳卡牌靠近畫面邊緣會自動捲動戰場。右下縮圖與邊緣箭頭可跳到畫面外的合法格。◎ 恢復預設，♜ 回到自己的 Avatar，雙擊空地也會回到 Avatar。詳 可查看雙方牌庫與元素門檻。	Phones show the whole battlefield by default. Open a card pile to see its cards. When zoomed in, drag empty space to pan, or pinch to zoom and pan. Drag cards near an edge to scroll. The minimap and edge arrows reveal off-screen legal targets. Use ◎ to reset, ♜ to focus your Avatar, or double-tap empty space to focus it. Info shows libraries and elemental thresholds.
需要回應時，只會出現讓過或防禦。單位的射擊、裝備與能力統一由彈窗選擇。目標彈窗可按「在戰場選擇」收起，再點高亮格子；按「查看選項」可再次打開。點擊、右鍵或長按均可檢視卡牌；點外面、×、「關閉」或 Escape 都只收起彈窗；取消／略過效果請使用標示的按鈕。	When a response is needed, pass or defend. Choose ranged attacks, equipment and abilities in their action popup. Choose on battlefield closes a target popup so you can tap the highlighted square; View options reopens it. Tap, right-click or hold a card for details. Clicking outside, ×, Close or Escape only closes the popup. Use the explicit cancel or skip action to decline an effect.
生命歸零會進入 Death’s Door。之後直接傷害 Avatar 才能造成致命一擊；攻擊地點只會造成生命流失。	At zero life, an Avatar enters Death’s Door. A later direct hit to the Avatar can be lethal; attacking a site only causes loss of life.
開發中的規則實作：官方資料可查閱；只有可操作卡牌能加入測試對局。完整規則仍待補齊。	Rules implementation is in progress. Official data is available, and only playable cards can enter test matches. Full rules coverage is still pending.
無法啟動遊戲	Could not start the game
請在 VS Code 對 index.html 使用 Open with Live Server。遊戲需要以 HTTP 載入本機 ES Modules 與 JSON。	Open index.html with Live Server in VS Code. The game needs HTTP to load local ES modules and JSON.
可用法力不足	Not enough available mana
元素門檻不足	Elemental thresholds not met
單位已橫置	The unit is tapped
召喚失調或 Disabled	Summoning sickness or disabled
行動與卡牌條件不符	The card’s conditions do not allow this action
此處沒有合法動作。	No legal actions at this location.
選擇已更新，請使用目前的選項	The choice has changed. Use the current options.
尚未輪到你。	It is not your turn yet.
已不同步，請雙方重新整理或回大廳。	The match is out of sync. Both players should reload or return to the lobby.
行動提示	Action notice
連線狀態	Connection status
本機對戰	Local play
本機遊戲	Local game
線上大廳	Online lobby
線上房間 · 交換牌組	Online rooms · Exchange decks
線上 lockstep	Online lockstep
連接 Firebase	Connect to Firebase
連線	Connection
連接失敗：	Connection failed: 
載入卡牌資料	Load card data
卡牌載入失敗：	Card loading failed: 
載入中	Loading
啟動中	Starting
無法啟動	Could not start
尚未連接	Not connected
連線後載入	Loads after connection
建立房間	Create room
加入（客）	Join as guest
房主重連	Reconnect as host
複製房號	Copy room code
重新整理房間列表	Refresh room list
輸入房號	Enter room code
房號	Room code
席位	Seat
房主	Host
在線	Online
離線／無心跳	Offline / no heartbeat
對手：在線	Opponent: online
對手：離線	Opponent: offline
近期房間（點房號可填入）	Recent rooms (select a code to fill it)
目前沒有房間	No rooms available
無）	None)
列表失敗：	Could not list rooms: 
建立失敗：	Could not create room: 
加入失敗：	Could not join: 
房主重連失敗：	Host reconnection failed: 
請輸入房號	Enter a room code
請輸入要重連的房號	Enter the room code to reconnect
已建立房間	Room created
已加入	Joined
請把房號給對手	Share the room code with your opponent
已以房主重連	Reconnected as host
若前一位客已離線會自動接手）	Takes over if the previous guest is offline)
已複製房號	Room code copied
上傳牌組	Upload deck
上傳失敗：	Deck upload failed: 
尚未上傳	Not uploaded yet
牌組已上傳（尚未 Ready）	Deck uploaded (not ready yet)
宣告 Ready	Ready
取消 Ready	Not ready
已取消 Ready	Ready status cleared
取消失敗：	Could not cancel: 
我的自創牌組（尚無，請至本機「我的牌組」儲存）	My custom decks (none; save one in My decks first)
正在載入預設／官方／自創牌組…	Loading official and saved decks…
官方牌組 JSON（含 decklist；選完會自動填入）	Official deck JSON (including decklist; filled when selected)
自創牌組請到本機遊戲「我的牌組」儲存後重新整理此頁；也可直接改下方官方 decklist JSON。	Save custom decks in My decks, then refresh this page. You can also edit the official decklist JSON below.
手動編輯下方 JSON	Edit the JSON below manually
牌組目錄就緒。請先連接 Firebase；可用兩個分頁互測。	Deck catalog ready. Connect to Firebase; you can test with two tabs.
請貼上或選擇牌組	Paste or select a deck
已載入	Loaded
副可用牌組	available decks
含	including
副自創	custom decks
尚無自創	no custom decks yet
尚無房號	No room code
對局就緒	Match ready
等待對手	Waiting for opponent
雙方牌組都 Ready 了	Both decks are ready
開始對局（房主）	Start match (host)
開始失敗：	Could not start: 
進入線上對局 →	Enter online match →
複製我的進房連結	Copy my match link
複製進房連結	Copy match link
已複製進房連結	Match link copied
已儲存	Saved
已寫入交接資料	Match handoff saved
重連／進入對局	Reconnect / enter match
重連並重放	Reconnect and replay
沒有大廳交接時，可輸入房號與席位，從 Firebase 重放 action log。	Without a lobby handoff, enter a room code and seat to replay the action log from Firebase.
席 0 房主	Seat 0 · Host
席 1 客	Seat 1 · Guest
請從大廳開始，或在下方重連。	Start from the lobby or reconnect below.
房間	Room
合法動作	Legal actions
狀態	Status
手牌（僅自己可見詳情）	Hand (only your own cards are visible)
自 Firebase 讀取牌組／seed	Read decks / seed from Firebase
接著重放 action log）	then replay the action log)
協定版本不符	Protocol version mismatch
引擎版本不符：交接	Engine version mismatch: handoff
引擎版本不符：房間	Engine version mismatch: room
請雙方 Ctrl+F5 硬重整後再進。	Both players should hard-reload with Ctrl+F5 before entering again.
請雙方硬重整或回大廳重開	Both players should reload or return to the lobby
房間不存在：	Room does not exist: 
房間牌組不完整	Room deck data is incomplete
已重放	Replayed
筆 action	actions
尚無 action（對局剛開始）	No actions yet (new match)
先手	First player
行動席	Acting seat
已套用見 log	applied; see log
單位	Units
對手心跳：	Opponent heartbeat: 
輪到你：選擇合法動作	Your turn: choose a legal action
等待席	Waiting for seat
勝者席	Winning seat
尚未開始對局	Match has not started
本機	Local
已連接	Connected
匿名 Auth	Anonymous auth
無 Auth，使用隨機 playerId）	No auth; using a random playerId)
可建立或加入房間	You can create or join a room
對手在線（心跳中）	Opponent online (heartbeat active)
對手離線（頁面關閉、Live Server 重整，或超過約 12 秒無心跳）	Opponent offline (page closed, Live Server reloaded, or no heartbeat for about 12 seconds)
你已 Ready，等待對手	You are ready; waiting for opponent
相同 build	matching build
雙方請用	Both players must use
開房、換牌、進 lockstep 對局。完整戰場 HUD 暫不接入，以免影響卡牌 FN 開發。	Create a room, exchange decks and enter a lockstep match. This test interface is separate from the full battlefield HUD.
非官方社群開發專案 · 大廳測試頁	Unofficial community project · Lobby test page
`.trim().split('\n').filter(row=>row.includes('\t')).map(row=>row.split('\t')))};

export const chineseStatic={
 'Air':'風','Earth':'地','Fire':'火','Water':'水','None':'無元素','CARDS':'張卡牌',
 'YOUR SPELLBOOK':'我的法術書','THE CARD ARCHIVE':'卡牌圖書館','DECK WORKSHOP':'牌組工坊','ENGINE STATUS':'引擎狀態','HOW TO PLAY':'操作說明','A NEW CHAPTER':'新對局','ONLINE LOBBY':'線上大廳','ONLINE LOCKSTEP':'線上同步對局',
 'Minion':'隨從','Magic':'魔法','Site':'地點','Artifact':'神器','Aura':'光環','Avatar':'化身','Ordinary':'普通','Exceptional':'精良','Elite':'菁英','Unique':'獨特',
 'Cannot add this card to the collection':'此卡不能加入收藏區','Collection limit reached':'已達收藏區張數上限'
};
