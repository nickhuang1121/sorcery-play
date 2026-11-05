import {multiCellCardSize, visualCenterPixels} from './multi-cell-visual.js';

function cellCenter(rect, board){
  return {x: rect.left + rect.width / 2 - board.left, y: rect.top + rect.height / 2 - board.top};
}

// Re-reads the live cell boxes, so a zoom or resize cannot leave the card on a stale pixel.
export function placeMultiCellCards(board){
  if (!board?.querySelectorAll) return;
  const slots = [...board.querySelectorAll(':scope > .multi-span-slot')];
  if (!slots.length) return;
  const origin = board.querySelector(':scope > [data-at="0"]');
  const right = board.querySelector(':scope > [data-at="1"]');
  const below = board.querySelector(':scope > [data-at="5"]');
  if (!origin || !right || !below) return;
  const boardBox = board.getBoundingClientRect();
  const a = origin.getBoundingClientRect(), b = right.getBoundingClientRect(), c = below.getBoundingClientRect();
  if (a.width < 2 || a.height < 2) return;
  const stepX = (b.left + b.width / 2) - (a.left + a.width / 2);
  const stepY = (c.top + c.height / 2) - (a.top + a.height / 2);
  if (Math.abs(stepX) < 2 || Math.abs(stepY) < 2) return;
  const size = multiCellCardSize(a.width, a.height);
  if (size.width < 1) return;
  const cell0 = cellCenter(a, boardBox);
  const seen = new Map();
  for (const slot of slots){
    const position = {x: Number(slot.dataset.multiX), y: Number(slot.dataset.multiY)};
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) continue;
    const key = position.x + ',' + position.y;
    const n = seen.get(key) || 0;
    seen.set(key, n + 1);
    const center = visualCenterPixels(cell0, stepX, stepY, position);
    const nudge = n * Math.min(12, size.width * 0.14);
    slot.style.left = (center.x + nudge) + 'px';
    slot.style.top = (center.y + nudge) + 'px';
    slot.style.width = size.width + 'px';
    slot.style.height = size.height + 'px';
  }
}

// Drag and hover keep the cell under the pointer. The floating card is the
// target when the pointer is on it, and it does not become the cell itself.
export function boardPointerTarget(x, y){
  const top = document.elementFromPoint(x, y);
  if (!top?.closest) return {targetNode: null, cell: null};
  const slot = top.closest('.multi-span-slot');
  const targetNode = top.closest('[data-unit],[data-object]');
  if (!slot) return {targetNode, cell: top.closest('[data-at]')};
  let cell = null;
  for (const node of document.elementsFromPoint(x, y)){
    if (node.closest?.('.multi-span-slot')) continue;
    const at = node.closest?.('[data-at]');
    if (at){ cell = at; break; }
  }
  if (!cell){
    let best = null, bestD = Infinity;
    for (const at of (slot.dataset.multiSites || '').split(',')){
      const el = document.querySelector(`.board [data-at="${at}"]`);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const d = (x - (r.left + r.width / 2)) ** 2 + (y - (r.top + r.height / 2)) ** 2;
      if (d < bestD){ bestD = d; best = el; }
    }
    cell = best;
  }
  return {targetNode, cell};
}
