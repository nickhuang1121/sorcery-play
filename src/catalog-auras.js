import {geometryLocationRecords,setFixedGeometry} from './final-geometry.js';
export {catalogAuraActive,catalogAuraDisabled} from './aura-source-state.js';
// "Here" is the actual location, including its layer. A cell shared by surface
// and subsurface is not one location. Multi-location units are tested per part.
export function catalogAuraHere(a,u,inside){return geometryLocationRecords(u).some(loc=>loc.layer===(a.layer||'surface')&&inside(a,loc.at));}
// "Occupying affected sites" includes either layer, but never a Void square.
export function catalogAuraAffectedSite(s,a,u,inside){return geometryLocationRecords(u).some(loc=>!!s.board[loc.at]&&inside(a,loc.at));}

// Non-unit Aura shape is defined by its occupied intersections/border, not by a
// guessed size=2. In particular a wall occupies two cells, not a 2x2 square.
export function catalogAuraPhysicalShape(a,inside){
 const shape={...a};setFixedGeometry(shape,Array.from({length:20},(_,at)=>at).filter(at=>inside(a,at)),!!a.geometryWrap);return shape;
}
