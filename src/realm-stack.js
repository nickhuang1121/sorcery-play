import {geometryLocationRecords} from './final-geometry.js';
// Display order is external to game state. A unit can appear in both layers
// only when its real occupied-location records actually contain both layers.
export function unitsAtLayer(units,at,layer,order=new Map()){
 return units.filter(u=>geometryLocationRecords(u).some(loc=>loc.at===at&&loc.layer===layer)).sort((a,b)=>(order.get(a.uid)||0)-(order.get(b.uid)||0));
}
