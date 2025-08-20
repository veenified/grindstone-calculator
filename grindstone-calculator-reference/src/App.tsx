import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Toggle } from '@/components/ui/toggle'
import { Download, Upload, Eraser, Crosshair, Gem, AlertTriangle, ShieldQuestion, KeyRound, Target, Swords, Radar } from 'lucide-react'

type Vec = { r: number; c: number }
type Tile = {
  color?: string | null
  grindstone?: boolean
  angry?: boolean
  chest?: boolean
  key?: boolean
  jerk?: boolean
  super?: boolean
  hitRange?: number
  hp?: number
}
type Weights = { w_len: number; w_gs: number; w_risk: number; w_obj: number }
type BoardModel = {
  rows: number
  cols: number
  jorj: Vec
  tiles: Record<string, Tile>
  weights: Weights
  avoidEnemies: boolean
}

const DIRS: Vec[] = [
  { r: -1, c: -1 }, { r: -1, c: 0 }, { r: -1, c: 1 },
  { r: 0, c: -1 },                 { r: 0, c: 1 },
  { r: 1, c: -1 }, { r: 1, c: 0 }, { r: 1, c: 1 },
]
const keyOf = (v: Vec) => `${v.r},${v.c}`
const inBounds = (b: BoardModel, v: Vec) => v.r >= 0 && v.r < b.rows && v.c >= 0 && v.c < b.cols
function neighbors(b: BoardModel, v: Vec): Vec[] {
  const list: Vec[] = []
  for (const d of DIRS) {
    const n = { r: v.r + d.r, c: v.c + d.c }
    if (inBounds(b, n)) list.push(n)
  }
  return list
}
const getTile = (b: BoardModel, v: Vec) => b.tiles[keyOf(v)]
const chebyshev = (a: Vec, b: Vec) => Math.max(Math.abs(a.r - b.r), Math.abs(a.c - b.c))
const angryNeighbors = (b: BoardModel, v: Vec) => neighbors(b, v).reduce((acc, n) => acc + (getTile(b, n)?.angry ? 1 : 0), 0)
const grindstoneThresholds = (len: number) => Math.floor(len / 10)

function objectiveHits(b: BoardModel, path: Vec[]): number {
  let hits = 0; const seen = new Set<string>();
  for (const p of path) {
    const t = getTile(b, p); if (!t) continue;
    (['chest','key'] as const).forEach(flag => {
      if ((t as any)[flag] && !seen.has(`${keyOf(p)}:${flag}`)) { hits++; seen.add(`${keyOf(p)}:${flag}`) }
    })
  }
  return hits
}

function computeDangerSet(b: BoardModel): Set<string> {
  const danger = new Set<string>()
  for (const [k, t] of Object.entries(b.tiles)) {
    if (!(t.jerk || t.super)) continue
    const [r,c] = k.split(',').map(Number); const v = { r, c }
    const range = Math.max(0, t.hitRange ?? 1)
    for (let dr = -range; dr <= range; dr++) {
      for (let dc = -range; dc <= range; dc++) {
        const n = { r: r + dr, c: c + dc }
        if (!inBounds(b, n)) continue
        if (chebyshev(v, n) <= range) danger.add(keyOf(n))
      }
    }
  }
  return danger
}

function score(b: BoardModel, path: Vec[], chainColor: string | null) {
  const L = path.length
  const gs = grindstoneThresholds(L)
  const risk = path.length ? angryNeighbors(b, path[path.length - 1]) : 0
  const obj = objectiveHits(b, path)
  const { w_len, w_gs, w_risk, w_obj } = b.weights
  const total = w_len * L + w_gs * gs - w_risk * risk + w_obj * obj
  return { total, L, gs, risk, obj }
}

type BestResult = { score: number; path: Vec[]; color: string | null; breakdown: { L: number; gs: number; risk: number; obj: number } }

function canStep(b: BoardModel, from: Vec, to: Vec, chainColor: string | null, danger: Set<string>) {
  const tFrom = getTile(b, from); const tTo = getTile(b, to)
  const toHasSwitch = !!(tTo && (tTo.grindstone))
  if (!tTo) return { ok: false, nextColor: chainColor }
  if (tTo.jerk || tTo.super) return { ok: false, nextColor: chainColor }
  if (!tTo.color) {
    if (toHasSwitch) return { ok: true, nextColor: chainColor }
    return { ok: false, nextColor: chainColor }
  }
  if (chainColor === null) return { ok: true, nextColor: tTo.color }
  if (tTo.color === chainColor) return { ok: true, nextColor: chainColor }
  if ((tFrom?.grindstone || toHasSwitch)) return { ok: true, nextColor: tTo.color }
  return { ok: false, nextColor: chainColor }
}

function startColors(b: BoardModel) {
  const colors = new Set<string>()
  const t = getTile(b, b.jorj); if (t?.color) colors.add(t.color)
  for (const nb of neighbors(b, b.jorj)) { const tn = getTile(b, nb); if (tn?.color) colors.add(tn.color) }
  if (colors.size === 0) { Object.values(b.tiles).forEach(ti => { if (ti.color) colors.add(ti.color) }) }
  return colors
}

function bestMove(b: BoardModel): BestResult | null {
  const danger = computeDangerSet(b)
  const best: BestResult = { score: -Infinity, path: [], color: null, breakdown: { L: 0, gs: 0, risk: 0, obj: 0 } }
  const seen = new Set<string>()
  const MAX_PATH_LENGTH = 50 // Prevent extremely long paths
  
  function dfs(pos: Vec, chainColor: string | null, path: Vec[]) {
    // Create a more efficient state key that doesn't include the entire path history
    const visitedPositions = new Set(path.map(keyOf))
    const stateKey = `${keyOf(pos)}|${chainColor}|${visitedPositions.size}`
    if (seen.has(stateKey)) return; seen.add(stateKey)
    
    // Limit path length to prevent infinite recursion
    if (path.length >= MAX_PATH_LENGTH) return
    
    const s = score(b, path, chainColor)
    if (s.total > best.score) { best.score = s.total; best.path = [...path]; best.color = chainColor; best.breakdown = { L: s.L, gs: s.gs, risk: s.risk, obj: s.obj } }
    for (const nb of neighbors(b, pos)) {
      if (path.some(p => p.r === nb.r && p.c === nb.c)) continue
      const step = canStep(b, pos, nb, chainColor, danger)
      if (!step.ok) continue
      path.push(nb); dfs(nb, step.nextColor, path); path.pop()
    }
  }
  const starters = startColors(b)
  for (const col of starters) {
    for (const nb of neighbors(b, b.jorj)) {
      const step = canStep(b, b.jorj, nb, col, danger)
      if (!step.ok) continue
      dfs(nb, step.nextColor, [nb])
    }
  }
  if (best.score === -Infinity) return null
  return best
}

const COLORS = ['red','blue','yellow','green','purple','orange'] as const
type Tool =
  | { kind: 'paint'; color: string }
  | { kind: 'toggle'; flag: keyof Tile }
  | { kind: 'enemy'; type: 'jerk' | 'super' }
  | { kind: 'erase' }
  | { kind: 'setJorj' }

const DEFAULT_BOARD: BoardModel = {
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
  avoidEnemies: True as unknown as boolean
} as unknown as BoardModel
// Note: TS quirk above just to inline a literal 'true' while keeping type inference simple.

function cellBg(color?: string | null) {
  if (!color) return 'bg-slate-100'
  const map: Record<string,string> = {
    red: 'bg-red-200', blue: 'bg-blue-200', yellow: 'bg-yellow-200',
    green: 'bg-green-200', purple: 'bg-purple-200', orange: 'bg-orange-200',
  }
  return map[color] ?? 'bg-slate-100'
}
function Badge({ children, title }: { children: React.ReactNode; title?: string }) {
  return <span title={title} className="px-1.5 py-0.5 text-[10px] rounded bg-black/70 text-white leading-none">{children}</span>
}
function PathOverlay({ path, cellSize }: { path: Vec[]; cellSize: number }) {
  if (!path.length) return null
  const points = path.map(p => ({ x: (p.c + 0.5) * cellSize, y: (p.r + 0.5) * cellSize }))
  const d = points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ')
  return (
    <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
      <path d={d} strokeWidth={4} fill="none" stroke="currentColor" className="text-slate-800/70" />
      {points.map((pt, idx) => (
        <g key={idx}>
          <circle cx={pt.x} cy={pt.y} r={12} className="fill-slate-900" />
          <text x={pt.x} y={pt.y + 4} textAnchor="middle" className="fill-white text-[10px] font-bold">{idx + 1}</text>
        </g>
      ))}
    </svg>
  )
}

export default function App() {
  const [board, setBoard] = useState<BoardModel>(DEFAULT_BOARD)
  const [tool, setTool] = useState<Tool>({ kind: 'paint', color: 'red' })
  const [result, setResult] = useState<BestResult | null>(null)
  const [cellPx, setCellPx] = useState(48)
  const [enemyRange, setEnemyRange] = useState<number>(1)

  const gridStyle = { gridTemplateColumns: `repeat(${board.cols}, ${cellPx}px)`, gridTemplateRows: `repeat(${board.rows}, ${cellPx}px)` } as React.CSSProperties

  function updateTileAt(v: Vec, updater: (t: Tile | undefined) => Tile | undefined) {
    setBoard(prev => {
      const k = keyOf(v)
      const nextTiles = { ...prev.tiles }
      const newT = updater(nextTiles[k])
      if (newT === undefined || Object.keys(newT).length === 0) { delete nextTiles[k] }
      else { nextTiles[k] = newT }
      return { ...prev, tiles: nextTiles }
    })
  }

  function handleCellClick(r: number, c: number) {
    const v = { r, c }
    if (tool.kind === 'setJorj') { setBoard(prev => ({ ...prev, jorj: v })); return }
    if (tool.kind === 'erase') { updateTileAt(v, _ => undefined); return }
    if (tool.kind === 'paint') { updateTileAt(v, t => ({ ...(t ?? {}), color: tool.color })); return }
    if (tool.kind === 'toggle') { updateTileAt(v, t => ({ ...(t ?? {}), [tool.flag]: !(t?.[tool.flag] as any) })); return }
    if (tool.kind === 'enemy') {
      if (tool.type === 'jerk') updateTileAt(v, t => ({ ...(t ?? {}), jerk: True as any, super: false, hitRange: enemyRange }))
      if (tool.type === 'super') updateTileAt(v, t => ({ ...(t ?? {}), super: True as any, jerk: false, hitRange: enemyRange }))
      return
    }
  }

  function run() { const res = bestMove(board); setResult(res) }
  function clearAll() { setBoard(prev => ({ ...prev, tiles: {} })); setResult(null) }

  function exportJson() {
    const data = JSON.stringify(board, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = 'grindstone-board.json'; a.click(); URL.revokeObjectURL(url)
  }

  function importJson(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]; if (!file) return
    const reader = new FileReader(); reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (typeof parsed?.rows === 'number' && typeof parsed?.cols === 'number' && parsed?.jorj && parsed?.tiles && parsed?.weights) {
          setBoard(parsed); setResult(null)
        } else { alert('Invalid JSON shape.') }
      } catch { alert('Failed to parse JSON.') }
    }; reader.readAsText(file)
  }

  const resultPathSet = useMemo(() => new Set(result?.path.map(p => keyOf(p))), [result])

  const toolButton = (child: React.ReactNode, isActive: boolean, onClick: () => void, title?: string) => (
    <Toggle pressed={isActive} onPressedChange={() => onClick()} className="data-[state=on]:bg-slate-900 data-[state=on]:text-white" title={title}>
      {child}
    </Toggle>
  )

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Grindstone Calculator — Enemies & Ranges</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportJson} title="Export board JSON"><Download className="w-4 h-4 mr-2"/>Export</Button>
          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-slate-50">
            <Upload className="w-4 h-4"/>
            <span>Import</span>
            <input type="file" className="hidden" accept="application/json" onChange={importJson} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Board</span>
              <div className="flex items-center gap-2 text-sm">
                <Label htmlFor="cellPx">Cell px</Label>
                <Input id="cellPx" type="number" className="w-20" value={cellPx} onChange={e => setCellPx(Math.max(24, Math.min(72, Number(e.target.value) || 48)))} />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="flex flex-col gap-2 min-w-[200px]">
                <div className="text-xs uppercase tracking-wide text-slate-500">Tools</div>
                <div className="grid grid-cols-3 gap-2">
                  {COLORS.map(c => (
                    <div key={c} className="flex flex-col items-center gap-1">
                      {toolButton(<div className={['w-6 h-6 rounded', cellBg(c)].join(' ')} />, tool.kind === 'paint' && tool.color === c, () => setTool({ kind: 'paint', color: c }), `Paint ${c}`)}
                      <span className="text-[10px] text-slate-600">{c}</span>
                    </div>
                  ))}
                  <div className="flex flex-col items-center gap-1">
                    {toolButton(<Eraser className="w-5 h-5"/>, tool.kind === 'erase', () => setTool({ kind: 'erase' }), 'Erase')}
                    <span className="text-[10px] text-slate-600">erase</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    {toolButton(<Crosshair className="w-5 h-5"/>, tool.kind === 'setJorj', () => setTool({ kind: 'setJorj' }), 'Set Jorj')}
                    <span className="text-[10px] text-slate-600">set jorj</span>
                  </div>
                </div>

                <div className="mt-3 text-xs uppercase tracking-wide text-slate-500">Flags</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center gap-1">{toolButton(<Gem className="w-5 h-5"/>, tool.kind==='toggle' && tool.flag==='grindstone', () => setTool({ kind:'toggle', flag:'grindstone' }), 'Toggle Grindstone')}<span className="text-[10px]">grindstone</span></div>
                  <div className="flex flex-col items-center gap-1">{toolButton(<AlertTriangle className="w-5 h-5"/>, tool.kind==='toggle' && tool.flag==='angry', () => setTool({ kind:'toggle', flag:'angry' }), 'Toggle Angry')}<span className="text-[10px]">angry</span></div>
                  <div className="flex flex-col items-center gap-1">{toolButton(<Target className="w-5 h-5"/>, tool.kind==='toggle' && tool.flag==='chest', () => setTool({ kind:'toggle', flag:'chest' }), 'Toggle Chest')}<span className="text-[10px]">chest</span></div>
                  <div className="flex flex-col items-center gap-1">{toolButton(<KeyRound className="w-5 h-5"/>, tool.kind==='toggle' && tool.flag==='key', () => setTool({ kind:'toggle', flag:'key' }), 'Toggle Key')}<span className="text-[10px]">key</span></div>
                </div>

                <div className="mt-3 text-xs uppercase tracking-wide text-slate-500">Enemies</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center gap-1">{toolButton(<ShieldQuestion className="w-5 h-5"/>, tool.kind==='enemy' && tool.type==='jerk', () => setTool({ kind:'enemy', type:'jerk' }), 'Place Jerk')}<span className="text-[10px]">jerk</span></div>
                  <div className="flex flex-col items-center gap-1">{toolButton(<Radar className="w-5 h-5"/>, tool.kind==='enemy' && tool.type==='super', () => setTool({ kind:'enemy', type:'super' }), 'Place Super Enemy')}<span className="text-[10px]">super</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2 items-center mt-1">
                  <Label>Hit range</Label>
                  <Input type="number" min={0} max={8} value={enemyRange} onChange={e => setEnemyRange(Math.max(0, Math.min(8, Number(e.target.value)||0)))} />
                </div>
                <div className="grid grid-cols-2 gap-2 items-center mt-1">
                  <Label>Avoid enemies</Label>
                  <Toggle pressed={board.avoidEnemies} onPressedChange={() => setBoard(prev => ({ ...prev, avoidEnemies: !prev.avoidEnemies }))}>
                    {board.avoidEnemies ? 'ON' : 'OFF'}
                  </Toggle>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Button onClick={run} className="w-full"><Swords className="w-4 h-4 mr-2"/>Find Best Move</Button>
                  <Button variant="secondary" onClick={clearAll} className="w-full">Clear</Button>
                </div>
              </div>

              <div className="relative">
                <div className="grid border rounded-lg overflow-hidden" style={gridStyle}>
                  {Array.from({ length: board.rows }).map((_, r) => (
                    Array.from({ length: board.cols }).map((__, c) => {
                      const t = getTile(board, { r, c })
                      const isJorj = board.jorj.r === r && board.jorj.c === c
                      const isPath = result && resultPathSet.has(`${r},${c}`)
                      return (
                        <div key={`${r}-${c}`} className={['relative border border-white/40', cellBg(t?.color), 'cursor-pointer hover:outline hover:outline-2 hover:outline-slate-400 transition-colors flex items-center justify-center'].join(' ')} style={{ width: cellPx, height: cellPx }} onClick={() => handleCellClick(r, c)} title={`${r},${c}`}>
                          <div className="absolute top-1 left-1 flex gap-1">
                            {t?.grindstone && <Badge title="Grindstone"><Gem className="w-3 h-3"/></Badge>}
                            {t?.angry && <Badge title="Angry">ANG</Badge>}
                            {t?.chest && <Badge title="Chest">CH</Badge>}
                            {t?.key && <Badge title="Key">KEY</Badge>}
                            {t?.jerk && <Badge title={`Jerk (R:${t.hitRange ?? 1})`}>J{t.hitRange ?? 1}</Badge>}
                            {t?.super && <Badge title={`Super (R:${t.hitRange ?? 1})`}>S{t.hitRange ?? 1}</Badge>}
                          </div>
                          {isJorj && (<motion.div layoutId="jorj" className="absolute inset-1 rounded-full bg-slate-800/80 flex items-center justify-center text-white text-[10px] font-bold">J</motion.div>)}
                          {isPath && (<div className="absolute inset-0 ring-2 ring-slate-800/60 pointer-events-none" />)}
                        </div>
                      )
                    })
                  ))}
                </div>
                {result && <PathOverlay path={result.path} cellSize={cellPx} />}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>Board Settings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Rows</Label><Input type="number" value={board.rows} onChange={e => setBoard(prev => ({ ...prev, rows: Math.max(3, Number(e.target.value)||9) }))} /></div>
                <div><Label>Cols</Label><Input type="number" value={board.cols} onChange={e => setBoard(prev => ({ ...prev, cols: Math.max(3, Number(e.target.value)||9) }))} /></div>
              </div>
              <div>
                <Label>Jorj (r,c)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" value={board.jorj.r} onChange={e => setBoard(prev => ({ ...prev, jorj: { ...prev.jorj, r: Math.max(0, Math.min(prev.rows-1, Number(e.target.value)||0)) } }))} />
                  <Input type="number" value={board.jorj.c} onChange={e => setBoard(prev => ({ ...prev, jorj: { ...prev.jorj, c: Math.max(0, Math.min(prev.cols-1, Number(e.target.value)||0)) } }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Scoring Weights</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[['Chain length','w_len'],['Grindstone thresholds','w_gs'],['Risk (angry adj.)','w_risk'],['Objectives (chest/key)','w_obj']] as const}.map(([label, key]: any) => (
                <div key={key} className="grid grid-cols-2 gap-2 items-center">
                  <Label>{label}</Label>
                  <Input type="number" step="0.1" value={(board.weights as any)[key]} onChange={e => setBoard(prev => ({ ...prev, weights: { ...prev.weights, [key]: Number(e.target.value) } as Weights }))} />
                </div>
              ))
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Result</CardTitle></CardHeader>
            <CardContent>
              {!result ? (
                <div className="text-slate-500 text-sm">Run the calculator to see the best path.</div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div><span className="font-semibold">Score:</span> {result.score.toFixed(2)}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Chain length: <span className="font-semibold">{result.breakdown.L}</span></div>
                    <div>Grindstone thresholds: <span className="font-semibold">{result.breakdown.gs}</span></div>
                    <div>Risk (angry adj.): <span className="font-semibold">{result.breakdown.risk}</span></div>
                    <div>Objectives hit: <span className="font-semibold">{result.breakdown.obj}</span></div>
                  </div>
                  <div className="mt-2">
                    <div className="font-semibold mb-1">Path (r,c):</div>
                    <div className="flex flex-wrap gap-1">
                      {result.path.map((p, i) => (<span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">{i+1}: ({p.r},{p.c})</span>))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent className="text-xs text-slate-600 space-y-2">
              <p>New: place <strong>Jerks</strong> or <strong>Super enemies</strong> with a configurable Chebyshev <em>hit range</em>. With <em>Avoid enemies</em> ON, the search will avoid ending chains near angry enemies (risk penalty), but can still step onto enemy cells during the chain. Range visual is shown on the badge (e.g., J2 or S3).</p>
              <p><strong>Note:</strong> The algorithm now allows stepping onto enemy cells during chains, but still penalizes ending chains near angry enemies. This enables more strategic pathfinding while maintaining risk awareness.</p>
              <p>Modeled rules: 8-direction movement; chain same color; grindstone switch (also allowed through colorless grindstone); no revisits; landing risk penalized by adjacent Angry tiles; objectives give bonuses.</p>
              <p>Not yet modeled: moving enemies, per-turn anger timers, HP-gated chains, item/gear usage, exit/greed logic.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
