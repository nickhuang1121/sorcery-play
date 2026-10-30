export const betaTerrainPassives={mountain_pass:{occupiedGroundEntry:true},updraft_ridge:{freeAirborneDeparture:true}};
export const betaTerrainDefinitions={
  cloud_city:{activated:[{label:'Air 3，每回合一次：飛往附近虛空',threshold:{air:3},once:true,declare:true,steps:[{op:'flySite',select:{kind:'location',nearby:true,voidOnly:true}}]}]},
  sinkhole:{activated:[{label:'犧牲 Sinkhole：摧毀附近地點',sacrificeSite:true,declare:true,steps:[{op:'collapseSite',select:{kind:'site',nearby:true,snapshot:true}}]}]},
  vesuvius:{activated:[{label:'Fire 3，犧牲 Vesuvius：附近地點上的所有單位受到 3 傷害',threshold:{fire:3},sacrificeSite:true,steps:[{op:'eruptSite'}]}]},
  shifting_sands:{genesis:[{op:'repeatDesertGenesis'}]},
  undertow:{genesis:[{op:'undertowChoose',select:{kind:'unit',inBody:true,anyRegion:true}}]},
  riptide:{cast:[{op:'riptideChoose',select:{kind:'site',water:true}},{op:'drawCards',count:1}]},
};
export const betaTerrainOperations=['commitSite','flySite','collapseSite','eruptSite','repeatDesertGenesis','undertowChoose','forcedWaterStep','riptideChoose','riptideMove'];
