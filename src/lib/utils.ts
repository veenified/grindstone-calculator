import type { Vec, Tile, BoardModel } from './types';

export const keyOf = (v: Vec) => `${v.r},${v.c}`;
export const inBounds = (b: BoardModel, v: Vec) => v.r >= 0 && v.r < b.rows && v.c >= 0 && v.c < b.cols;

export function neighbors(b: BoardModel, v: Vec): Vec[] {
  const list: Vec[] = [];
  for (const d of [{r: -1, c: -1}, {r: -1, c: 0}, {r: -1, c: 1}, {r: 0, c: -1}, {r: 0, c: 1}, {r: 1, c: -1}, {r: 1, c: 0}, {r: 1, c: 1}]) {
    const n = { r: v.r + d.r, c: v.c + d.c };
    if (inBounds(b, n)) list.push(n);
  }
  return list;
}

export const getTile = (b: BoardModel, v: Vec) => b.tiles[keyOf(v)];
export const chebyshev = (a: Vec, b: Vec) => Math.max(Math.abs(a.r - b.r), Math.abs(a.c - b.c));
export const angryNeighbors = (b: BoardModel, v: Vec) => neighbors(b, v).reduce((acc, n) => acc + (getTile(b, n)?.angry ? 1 : 0), 0);
export const grindstoneThresholds = (len: number) => Math.floor(len / 10);

export function objectiveHits(b: BoardModel, path: Vec[]): number {
  let hits = 0; 
  const seen = new Set<string>();
  for (const p of path) {
    const t = getTile(b, p); 
    if (!t) continue;
    (['chest', 'key'] as const).forEach(flag => {
      if ((t as any)[flag] && !seen.has(`${keyOf(p)}:${flag}`)) { 
        hits++; 
        seen.add(`${keyOf(p)}:${keyOf(p)}:${flag}`); 
      }
    });
  }
  return hits;
}

export function computeDangerSet(b: BoardModel): Set<string> {
  const danger = new Set<string>();
  for (const [k, t] of Object.entries(b.tiles)) {
    if (!(t.jerk || t.angry)) continue;
    const [r, c] = k.split(',').map(Number); 
    const v = { r, c };
    
    if (t.angry) {
      // 4-directional: N, S, E, W
      const directions = [{r: -1, c: 0}, {r: 1, c: 0}, {r: 0, c: 1}, {r: 0, c: -1}];
      for (const d of directions) {
        const n = { r: r + d.r, c: c + d.c };
        if (inBounds(b, n)) danger.add(keyOf(n));
      }
    }
    
    if (t.jerk) {
      // 8-directional: N, S, E, W, NE, SE, SW, NW
      const directions = [
        {r: -1, c: 0}, {r: 1, c: 0}, {r: 0, c: 1}, {r: 0, c: -1},
        {r: -1, c: 1}, {r: 1, c: 1}, {r: 1, c: -1}, {r: -1, c: -1}
      ];
      for (const d of directions) {
        const n = { r: r + d.r, c: c + d.c };
        if (inBounds(b, n)) danger.add(keyOf(n));
      }
    }
  }
  return danger;
}

export function score(b: BoardModel, path: Vec[], chainColor: string | null) {
  const L = path.length;
  const gs = grindstoneThresholds(L);
  const risk = path.length ? angryNeighbors(b, path[path.length - 1]) : 0;
  const obj = objectiveHits(b, path);
  
  // Count destroyed obstacles
  let destroyedObstacles = 0;
  for (const pos of path) {
    const tile = getTile(b, pos);
    if (tile?.chainGate && L >= tile.chainGate) {
      destroyedObstacles++;
    }
  }
  
  const { w_len, w_gs, w_risk, w_obj } = b.weights;
  const total = w_len * L + w_gs * gs - w_risk * risk + w_obj * obj + (destroyedObstacles * 10); // Bonus for destroying obstacles
  return { total, L, gs, risk, obj, destroyedObstacles };
}

export function canStep(b: BoardModel, from: Vec, to: Vec, chainColor: string | null, danger: Set<string>, pathLength: number = 0) {
  const tFrom = getTile(b, from); 
  const tTo = getTile(b, to);
  const toHasSwitch = !!(tTo && (tTo.grindstone));
  if (!tTo) return { ok: false, nextColor: chainColor };
  
  // Check if we can destroy an obstacle
  if (tTo.chainGate && pathLength >= tTo.chainGate) {
    return { ok: true, nextColor: chainColor, destroysObstacle: true };
  }
  
  if (!tTo.color) {
    if (toHasSwitch) return { ok: true, nextColor: chainColor };
    return { ok: false, nextColor: chainColor };
  }
  if (chainColor === null) return { ok: true, nextColor: tTo.color };
  if (tTo.color === chainColor) return { ok: true, nextColor: chainColor };
  if ((tFrom?.grindstone || toHasSwitch)) return { ok: true, nextColor: tTo.color };
  return { ok: false, nextColor: chainColor };
}

export function startColors(b: BoardModel) {
  const colors = new Set<string>();
  const t = getTile(b, b.jorj); 
  if (t?.color) colors.add(t.color);
  for (const nb of neighbors(b, b.jorj)) { 
    const tn = getTile(b, nb); 
    if (tn?.color) colors.add(tn.color); 
  }
  if (colors.size === 0) { 
    Object.values(b.tiles).forEach(ti => { 
      if (ti.color) colors.add(ti.color); 
    }); 
  }
  return colors;
}

export function bestMove(b: BoardModel): any {
  const danger = computeDangerSet(b);
  const best: any = { score: -Infinity, path: [], color: null, breakdown: { L: 0, gs: 0, risk: 0, obj: 0, destroyedObstacles: 0 } };
  const seen = new Set<string>();
  const MAX_PATH_LENGTH = 50; // Prevent extremely long paths
  
  function dfs(pos: Vec, chainColor: string | null, path: Vec[]) {
    // Create a more efficient state key that doesn't include the entire path history
    const visitedPositions = new Set(path.map(keyOf));
    const stateKey = `${keyOf(pos)}|${chainColor}|${visitedPositions.size}`;
    if (seen.has(stateKey)) return; 
    seen.add(stateKey);
    
    // Limit path length to prevent infinite recursion
    if (path.length >= MAX_PATH_LENGTH) return;
    
    const s = score(b, path, chainColor);
    if (s.total > best.score) { 
      best.score = s.total; 
      best.path = [...path]; 
      best.color = chainColor; 
      best.breakdown = { L: s.L, gs: s.gs, risk: s.risk, obj: s.obj, destroyedObstacles: s.destroyedObstacles }; 
    }
    for (const nb of neighbors(b, pos)) {
      if (path.some(p => p.r === nb.r && p.c === nb.c)) continue;
      const step = canStep(b, pos, nb, chainColor, danger, path.length);
      if (!step.ok) continue;
      path.push(nb); 
      dfs(nb, step.nextColor, path); 
      path.pop();
    }
  }
  
  const starters = startColors(b);
  for (const col of starters) {
    for (const nb of neighbors(b, b.jorj)) {
      const step = canStep(b, b.jorj, nb, col, danger, 0);
      if (!step.ok) continue;
      dfs(nb, step.nextColor, [nb]);
    }
  }
  if (best.score === -Infinity) return null;
  return best;
}

export function cellBg(color?: string | null) {
  if (!color) return 'bg-slate-100';
  const map: Record<string, string> = {
    red: 'bg-red-200', blue: 'bg-blue-200', yellow: 'bg-yellow-200',
    green: 'bg-green-200', purple: 'bg-purple-200', orange: 'bg-orange-200',
  };
  return map[color] ?? 'bg-slate-100';
}
