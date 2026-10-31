// Explicit user choices for this digital project, not official FAQ text.
export const PROJECT_RULE_PROFILE='user-rulings-20261030-v1';
const notes={
 magellan_globe:['離場後，跨邊光環保留原覆蓋格，不自動搬移；同一實際格重複投影的相同傷害值只算一次。','On removal, spanning Auras retain their actual covered squares. Repeated equal damage-grid values on one physical square count once.'],
 doomsday_device:['Globe使兩個4投影到同一格時只造成4，不相加。','If Globe maps two printed 4s to one square, that square takes 4, not 8.'],
 snowball:['在Globe閉環繞一圈回到起點即停止，正常結算一次。','On a closed Globe route, stop on the first return to the origin and resolve one impact.'],
 the_immortal_throne:['雙方同時符合勝利條件時，由當前回合玩家獲勝。','If both players simultaneously qualify, the current turn player wins.'],
};
export function projectRuleNote(slug,lang='zh'){const row=notes[slug];return row?(lang==='zh'?'專案裁定（使用者指定）：'+row[0]:'Project ruling (user-selected): '+row[1]):'';}
