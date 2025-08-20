export type Vec = { r: number; c: number };

export type Tile = {
  color?: string | null;
  grindstone?: boolean;
  angry?: boolean;
  chest?: boolean;
  key?: boolean;
  jerk?: boolean;
  chainGate?: number;
  hp?: number;
};

export type Weights = { 
  w_len: number; 
  w_gs: number; 
  w_risk: number; 
  w_obj: number 
};

export type BoardModel = {
  rows: number;
  cols: number;
  jorj: Vec;
  tiles: Record<string, Tile>;
  weights: Weights;
  avoidEnemies: boolean;
};

export type Tool =
  | { kind: 'paint'; color: string }
  | { kind: 'toggle'; flag: keyof Tile }
  | { kind: 'enemy'; type: 'jerk' | 'angry' }
  | { kind: 'obstacle'; chainGate: number }
  | { kind: 'erase' }
  | { kind: 'setJorj' };

export type BestResult = {
  score: number;
  path: Vec[];
  color: string | null;
  breakdown: { L: number; gs: number; risk: number; obj: number };
};

export const DIRS: Vec[] = [
  { r: -1, c: -1 }, { r: -1, c: 0 }, { r: -1, c: 1 },
  { r: 0, c: -1 },                 { r: 0, c: 1 },
  { r: 1, c: -1 }, { r: 1, c: 0 }, { r: 1, c: 1 },
];

export const COLORS = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'] as const;

export const DEFAULT_BOARD: BoardModel = {
  rows: 9, cols: 9, jorj: { r: 4, c: 4 },
  tiles: {
    '4,4': { color: 'red' },
    '4,5': { color: 'red' },
    '4,6': { color: 'red' },
    '5,6': { color: 'blue', grindstone: true },
    '6,7': { color: 'blue', angry: true },
    '2,2': { color: 'yellow', chest: true },
  },
  weights: { w_len: 1.0, w_gs: 3.0, w_risk: 2.0, w_obj: 4.0 },
  avoidEnemies: true
};
