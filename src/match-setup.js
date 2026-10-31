import {newGame,restoreGame} from './engine.js';
// Fresh games need the same runtime collections and passive hydration as saves.
export function createPlayableMatch(decks,seed,mode){return restoreGame(newGame(decks,seed,mode));}
