# Existing-service actual app UI audit

{
  "checkedAt": "2026-10-30T21:07:02.598776+00:00",
  "service": "http://127.0.0.1:5500/",
  "authorization": "User provided existing service and asked not to be disturbed while asleep. No questions/progress sent after this instruction. No bind attempted.",
  "browser": "Background IAB browser2 tab5; named chrome unavailable; used available existing browser surface.",
  "fixtureSetup": "tests/ui-audit-fixtures.html seeds reproducible states then navigates to actual index.html app; original browser match backed up and restored via UI.",
  "sourceProof": {
    "newWorkspaceFixturePageObserved": true,
    "latestStylesheetHref": "./styles/game.css?v=20261030-popover2",
    "hudOverflowAfterFix": "visible",
    "abilityButtonCenterHitAfterFix": "button",
    "newDegradationAndMonksAndMoebaBehaviorObserved": true,
    "byteHashEqualityVerified": false,
    "rawHttpReadLimitation": "Python urllib loopback reads denied Errno1 Operation not permitted; no retry or alternate raw-fetch route.",
    "newDredgeModuleBehaviorObserved": true,
    "newCradleVermisDiscountBehaviorObserved": true
  },
  "cases": [
    {
      "card": "Sparkmage",
      "result": "representative-ui-pass",
      "steps": [
        "real Avatar menu",
        "before fix center hit D1 cell and clicking moved Avatar",
        "fix more-specific landscape footer overflow rule",
        "reload sees popover2 CSS and button-center hit button",
        "native activation opens pre-cost location choice",
        "cancel leaves C1 Avatar untapped",
        "confirm D2 leaves C1 Avatar tapped, no erroneous movement"
      ],
      "limitation": "Fixture has castAir0; positive damage counters not tested in this UI scenario.",
      "screenshots": [
        "data/ui-5500-sparkmage-click-before-fix.jpg",
        "data/ui-5500-sparkmage-popover-fixed.jpg",
        "data/ui-5500-sparkmage-confirm-fixed.jpg"
      ]
    },
    {
      "card": "Common Sense",
      "result": "representative-ui-pass",
      "steps": [
        "real hand click",
        "fail-to-find visible beside matching Ordinary cards",
        "click fail pays2, hand0, deck3, RNG changes"
      ],
      "save": "data/ui-5500-common-sense-save.json",
      "screenshot": "data/ui-5500-common-sense-fail-to-find.jpg"
    },
    {
      "card": "Degradation",
      "result": "representative-ui-pass",
      "steps": [
        "real hand cast costs2",
        "enemy Brother Knight with Ward+Stealth remains selectable",
        "choose produces Foot Soldier same UID preserving Ward and Stealth"
      ],
      "save": "data/ui-5500-degradation-save.json",
      "screenshot": "data/ui-5500-degradation-retained-marks.jpg"
    },
    {
      "card": "Drown / Monks of Kobalsa",
      "result": "representative-ui-pass",
      "steps": [
        "real hand cast-time declaration",
        "confirm Monks pays3",
        "Monks gone from Realm and in owner1 cemetery"
      ],
      "save": "data/ui-5500-monks-save.json",
      "screenshot": "data/ui-5500-monks-drown.jpg"
    },
    {
      "card": "Megamoeba / Wall of Fire / Amethyst Core",
      "result": "representative-ui-pass",
      "steps": [
        "select actual unit",
        "keyboard Enter on already occupied D2 destination opens pseudopod choice",
        "browser reload restores pending choice",
        "choose C2 origin takes3, artifactAt13, body retained",
        "reset fixture and choose D2 origin takes0, artifactAt13"
      ],
      "saves": [
        "data/ui-5500-moeba-cross-save.json",
        "data/ui-5500-moeba-stay-save.json"
      ],
      "screenshots": [
        "data/ui-5500-moeba-wall-crossing.jpg",
        "data/ui-5500-moeba-stationary-origin.jpg"
      ],
      "limitation": "Clicking the own unit reopens its menu; keyboard destination activation was used. This is an actual supported app UI path, not injected dispatch."
    },
    {
      "card": "Dredge / Megamoeba / Skeleton",
      "result": "representative-ui-pass",
      "steps": [
        "real hand cast and water Site declaration",
        "first exact contacting pod selected, spent2 but no body moves and no Skeletons",
        "navigate away and return preserves second pending choice",
        "second choice adds Surface pod to both bodies, original Below parts retained",
        "only then two Skeleton tokens appear at target",
        "found per-square layer badge incorrectly used anchor; fixed renderer using actual location records",
        "actual reload/repeat now shows Below at B2/D2 and Surface+Below at C2",
        "fixed Chinese card text from units-only to everything/objects; visibly loaded new translation",
        "original browser match restored"
      ],
      "intermediateSkeletonCount": 0,
      "finalSkeletonCount": 2,
      "saves": [
        "data/ui-5500-dredge-mid-save.json",
        "data/ui-5500-dredge-end-save.json"
      ],
      "screenshots": [
        "data/ui-5500-dredge-two-moebas-complete.jpg",
        "data/ui-5500-dredge-local-layer-labels-fixed.jpg"
      ],
      "limitation": "Fixture-assisted full app UI; Aura/Avatar/tax branches are formal native tests, not browser-tested here."
    },
    {
      "card": "Cradle of Etherrum / De Vermis Mysteriis / Ancient Dragon",
      "result": "representative-ui-pass",
      "steps": [
        "fixture has4 available mana and zero Fire threshold",
        "actual top-spellbook dialog reveals Ancient Dragon printed7 Fire3",
        "actual use-top-spell and C1 destination confirmation casts Dragon here",
        "Vermis5 is discounted by Cradle1: mana4 becomes0",
        "physical top removed and Dragon owner0 at17",
        "original browser match restored"
      ],
      "save": "data/ui-5500-cradle-save.json",
      "screenshot": "data/ui-5500-cradle-vermis-four.jpg",
      "limitation": "Normal payment, other source/timing/region boundaries remain represented only by named native tests, not this UI case."
    }
  ],
  "doesNotProve": [
    "every rule/timing/combination per card",
    "all printed catalog UI flows",
    "physical Twister or Contract results",
    "raw byte equality of served source"
  ]
}

## Willing Tribute 犧牲成本與真實reload

2026-10-30 21:25 UTC，仍用使用者提供的現有5500，沒有新bind。fixture只建立初始hand+橫置Ghoul；後續實際UI手牌施放2mana到C2，點單位及犧牲能力，待untap選擇時reload。透過test頁可見Inspect結果確認Tribute已離Realm、墓地空、UID成本bundle仍存在；回遊戲選GhoulD2後真正untap，Tribute才入owner墓、bundle刪除。已Restore original match。證據`data/ui5500-tribute-{pending,resolved}.{json,jpg}`，UI操作沒有evaluate注入dispatch。只是此代表流程，未宣稱所有犧牲牌UI完整。

## Ring of Morrigan actual redirection / reload

2026-10-30 21:34 UTC: actual hand Zap1 targets own Brown BearsD2; Ring trigger chooses enemy AvatarC3. Actual Royal Bodyguard replacement dialog survives reload, then redirect is selected. Final visible board and inspected saved match: life[10,10], Guard1 damage, Bears1 damage, spent1, no choice. Ring does not heal after redirected damage, per official FAQ. Original match restored. Evidence: data/ui5500-ring-redirect-resolved.{jpg,json}. This representative flow is not complete-card UI approval.

## Flanking Maneuver actual Atlas choice

2026-10-30 21:36 UTC: handcast3, originC1 Surface, knight destinationB3 Surface, finish choosing with zero allies. Actual draw dialog offers Atlas or Spellbook; reload then choose1Atlas0Spells. Final inspected save: spent3, Atlas27->26, Spellbook57 unchanged, Valley in hand, Flank in cemetery, Avatar unchangedC1, no choice. Original match restored. data/ui5500-flank-atlas-resolved.{jpg,json}; limited to this genuine UI path, not all teleport interactions.

## Silver Bullet actual noncaster nested cast

2026-10-30 21:46 UTC: actual handconjure2 onto nonSpellcaster BearsC2; activate tap/sacrifice; real collection permission survives reload. Inspect pending: Bullet out of Realm, cemetery empty, physical UID held. Return actualgame, select Fireball, confirm north with printed4mana, select actual C3 hit. Final spent6, damage4, bearer tapped, Fireball consumed from collection while two ineligible cards remain, Fireball/Bullet in grave, cost and permission closed. Original browser match restored. data/ui5500-silver-{pending,resolved}.json and resolved.jpg; representative path only.

## Raven stack / Grapple / independently halved healing

2026-10-30 21:54 UTC actual two hand Raven spells choose Troll; Grapple chooses Troll then north, hit C3, real drag17->7, optional strike survives reload, confirm. Final life1->3 with RiverOfBlood, enemy3damage, mana7, two spell draws, buffs consumed. Saved JSON and screenshot data/ui5500-raven-stacks-resolved.*; original match restored. This validates actual strike and independent rounding, not an unverified control-change beneficiary.

Actual UI also exposed misleading Raven Chinese: attack instead of strike, and damage replaced by healing. Corrected that one dictionary value preserving CRLF; actual rightclick card inspection verified new wording, data/ui5500-raven-translation.jpg. Grapple optional strike button also said attack; changed to strike in src/fifty-cards.js, no separate re-operation of that changed label yet.

## Throne state visibility and wording (inspection only)

Actual object inspection of an explicitly authored level3 state exposed no current counter information. Added visible currentlevel3 and nextprintedcost3 guidance, then actually reopened and verified it on5500. Also corrected Chinese from onlyoneAvatar to Avatar being the only unit at that location, matching printed alone condition. data/ui5500-throne-level.jpg. Original browser match restored. This is inspection-only evidence, NOT proof that UI progression or victory was played through, and no dualThrone interpretation is added.

## Grey Wolves actual deck-workshop limit exception

Actual unsaved draft rejected fifthGreyWolves with rarity-limit toast despite printed unlimitedSpellbook. Corrected exactprintedGreyWolves exception in app.addCard for mainSpellbook only; fresh actualUI accepts5, then Collection stillcaps4. No deck saved/exported/cleared. After navigate/reload, actualworkshop shows defaultSpellbook60/Collection0, proving unsaveddraft discarded. data/ui5500-grey-{fifth-before,fifth-after,collection-limit}.jpg. Existing nativewave10 validates60Spellbook/fiveCollection invalid; this is the missing actualUI boundary, not completecard battle approval.
