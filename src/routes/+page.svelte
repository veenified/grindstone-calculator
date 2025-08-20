<script lang="ts">
  import { Header, Toolbar, Board, Settings } from '$lib/components';
  import { bestMove } from '$lib/utils';
  import { DEFAULT_BOARD } from '$lib/types';
  import type { BoardModel, Tool } from '$lib/types';

  let board: BoardModel = DEFAULT_BOARD;
  let tool: Tool = { kind: 'paint', color: 'red' };
  let result: any = null;
  let cellPx = 48;
  let chainGate = 1;


  function run() { result = bestMove(board); }
  function clearAll() { board = { ...board, tiles: {} }; result = null; }

  function exportJson() {
    const data = JSON.stringify(board, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'grindstone-board.json'; a.click(); URL.revokeObjectURL(url);
  }

  function importJson(ev: Event) {
    const target = ev.target as HTMLInputElement;
    const file = target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (typeof parsed?.rows === 'number' && typeof parsed?.cols === 'number' && parsed?.jorj && parsed?.tiles && parsed?.weights) {
          board = parsed; result = null;
        } else { alert('Invalid JSON shape.'); }
      } catch { alert('Failed to parse JSON.'); }
    }; reader.readAsText(file);
  }

  function handleCellClick(r: number, c: number) {
    const v = { r, c };

    
    if (tool.kind === 'setJorj') { board = { ...board, jorj: v }; return; }
    if (tool.kind === 'erase') { 

      const newTiles = { ...board.tiles };
      delete newTiles[`${r},${c}`];
      board = { ...board, tiles: newTiles };
      return; 
    }
    if (tool.kind === 'paint') { 

      board = { ...board, tiles: { ...board.tiles, [`${r},${c}`]: { ...board.tiles[`${r},${c}`], color: tool.color } } }; 
      return; 
    }
    if (tool.kind === 'toggle') { 
      const flag = tool.flag;
      const currentTile = board.tiles[`${r},${c}`] || {};
      board = { ...board, tiles: { ...board.tiles, [`${r},${c}`]: { ...currentTile, [flag]: !currentTile[flag] } } }; 
      return; 
    }
    if (tool.kind === 'enemy') {
      if (tool.type === 'jerk') {
        board = { ...board, tiles: { ...board.tiles, [`${r},${c}`]: { ...board.tiles[`${r},${c}`], jerk: true, angry: false } } };
      }
      if (tool.type === 'angry') {
        board = { ...board, tiles: { ...board.tiles, [`${r},${c}`]: { ...board.tiles[`${r},${c}`], angry: true, jerk: false } } };
      }
      return;
    }
    if (tool.kind === 'obstacle') {
      board = { ...board, tiles: { ...board.tiles, [`${r},${c}`]: { ...board.tiles[`${r},${c}`], chainGate: tool.chainGate } } };
      return;
    }
  }
</script>

<svelte:head>
  <title>Grindstone Calculator</title>
</svelte:head>

<div class="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-4 min-h-screen">
  <Header {board} onExport={exportJson} onImport={importJson} onRecall={(savedBoard) => { board = savedBoard; result = null; }} />

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div class="lg:col-span-2">
      <div class="bg-white rounded-lg border shadow-sm">
        <div class="p-6 border-b">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Board</h2>
            <div class="flex items-center gap-2 text-sm">
              <label for="cellPx">Cell px</label>
              <input id="cellPx" type="number" class="w-20 px-2 py-1 border rounded" bind:value={cellPx} min="24" max="72" />
            </div>
          </div>
        </div>
        <div class="p-6">
          <div class="flex items-start gap-4">
            <Toolbar {tool} {board} {chainGate} onRun={run} onClear={clearAll} onToolChange={(newTool) => tool = newTool} />
            <Board {board} {tool} {cellPx} {result} onCellClick={handleCellClick} />
          </div>
        </div>
      </div>
    </div>

    <Settings {board} {result} />
  </div>
</div>
