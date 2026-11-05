// Visual coordinates only. Callers pass sites the rules already computed.
// This module does not decide occupancy, movement, damage, or legality.
const COLS = 5, ROWS = 4;

function cellsOf(sites){
  return [...new Set((sites || []).filter(at => Number.isInteger(at) && at >= 0 && at < COLS * ROWS))];
}

// Shared corner of an actual 2×2 footprint, in grid-line space.
// x = 0 is the outer edge of column 0; x = 1 is the boundary between columns 0 and 1.
// Wrapped footprints (Magellan Globe) use the same sites, shifted across the seam.
export function getVisualPosition(card, sites){
  void card;
  const cells = cellsOf(sites);
  if (cells.length !== 4) return null;
  const pts = cells.map(at => ({x: at % COLS, y: Math.floor(at / COLS)}));
  const origin = pts[0];
  const rel = pts.map(p => {
    let dx = p.x - origin.x, dy = p.y - origin.y;
    if (dx > COLS / 2) dx -= COLS;
    if (dx < -COLS / 2) dx += COLS;
    if (dy > ROWS / 2) dy -= ROWS;
    if (dy < -ROWS / 2) dy += ROWS;
    return {dx, dy};
  });
  const minX = Math.min(...rel.map(p => p.dx)), maxX = Math.max(...rel.map(p => p.dx));
  const minY = Math.min(...rel.map(p => p.dy)), maxY = Math.max(...rel.map(p => p.dy));
  const w = maxX - minX + 1, h = maxY - minY + 1;
  if (w !== 2 || h !== 2) return null;
  const filled = new Set(rel.map(p => p.dx + ':' + p.dy));
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) if (!filled.has(x + ':' + y)) return null;
  return {x: origin.x + minX + w / 2, y: origin.y + minY + h / 2, columns: w, rows: h, sites: [...cells].sort((a, b) => a - b)};
}

// Midpoint of the shared edge between two orthogonally adjacent cells.
// A wall is conjured on that border, including a wrapped seam.
export function getBorderVisualPosition(anchor, other){
  if (!Number.isInteger(anchor) || !Number.isInteger(other) || anchor === other) return null;
  if (anchor < 0 || anchor >= COLS * ROWS || other < 0 || other >= COLS * ROWS) return null;
  let dx = (other % COLS) - (anchor % COLS);
  let dy = Math.floor(other / COLS) - Math.floor(anchor / COLS);
  if (dx > COLS / 2) dx -= COLS;
  if (dx < -COLS / 2) dx += COLS;
  if (dy > ROWS / 2) dy -= ROWS;
  if (dy < -ROWS / 2) dy += ROWS;
  if (Math.abs(dx) + Math.abs(dy) !== 1) return null;
  const ax = anchor % COLS, ay = Math.floor(anchor / COLS);
  return {
    x: ax + (dx === 1 ? 1 : dx === -1 ? 0 : 0.5),
    y: ay + (dy === 1 ? 1 : dy === -1 ? 0 : 0.5),
    columns: 1,
    rows: 1,
    sites: [anchor, other].sort((a, b) => a - b),
  };
}

// cell0 is the center of site 0, in the same pixel space as the board.
// stepX/stepY are the measured center deltas to site 1 and site 5, so zoom,
// gap, and a flipped seat all stay attached to the real cells.
export function visualCenterPixels(cell0, stepX, stepY, position){
  return {
    x: cell0.x + (position.x - 0.5) * stepX,
    y: cell0.y + (position.y - 0.5) * stepY,
  };
}

// One-cell card sitting on the shared corner, leaving the outer site labels visible.
export function multiCellCardSize(cellWidth, cellHeight){
  const aspect = 744 / 1039;
  const maxW = Math.max(0, cellWidth) * 0.72;
  const maxH = Math.max(0, cellHeight) * 0.72;
  if (maxW < 1 || maxH < 1) return {width: 0, height: 0};
  const width = Math.min(maxW, maxH * aspect);
  return {width, height: width / aspect};
}
