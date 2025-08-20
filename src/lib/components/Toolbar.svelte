<script lang="ts">
  import { Eraser, Crosshair, Gem, AlertTriangle, Target, KeyRound, ShieldQuestion, Swords } from 'lucide-svelte';
  import type { Tool, BoardModel } from '../types';
  import { COLORS } from '../types';
  import { cellBg } from '../utils';

  export let tool: Tool;
  export let board: BoardModel;
  export let chainGate: number;

  export let onRun: () => void;
  export let onClear: () => void;
  export let onToolChange: (newTool: Tool) => void;

  function updateTileAt(v: { r: number; c: number }, updater: (t: any) => any) {
    board = {
      ...board,
      tiles: (() => {
        const k = `${v.r},${v.c}`;
        const nextTiles = { ...board.tiles };
        const newT = updater(nextTiles[k]);
        if (newT === undefined || Object.keys(newT).length === 0) { 
          delete nextTiles[k]; 
        } else { 
          nextTiles[k] = newT; 
        }
        return nextTiles;
      })()
    };
  }

  function handleCellClick(r: number, c: number) {
    const v = { r, c };
    if (tool.kind === 'setJorj') { 
      board = { ...board, jorj: v }; 
      return; 
    }
    if (tool.kind === 'erase') { 
      updateTileAt(v, _ => undefined); 
      return; 
    }
    if (tool.kind === 'paint') { 
      updateTileAt(v, t => ({ ...(t ?? {}), color: (tool as { kind: 'paint'; color: string }).color })); 
      return; 
    }
    if (tool.kind === 'toggle') { 
      const flag = (tool as { kind: 'toggle'; flag: keyof any }).flag;
      updateTileAt(v, t => ({ ...(t ?? {}), [flag]: !(t?.[flag] as any) })); 
      return; 
    }
    if (tool.kind === 'enemy') {
      if (tool.type === 'jerk') updateTileAt(v, t => ({ ...(t ?? {}), jerk: true, angry: false }));
      if (tool.type === 'angry') updateTileAt(v, t => ({ ...(t ?? {}), angry: true, jerk: false }));
      return;
    }
    if (tool.kind === 'obstacle') {
      updateTileAt(v, t => ({ ...(t ?? {}), chainGate: tool.chainGate }));
      return;
    }
  }
</script>

<div class="flex flex-col gap-2 min-w-[200px]">
  <div class="text-xs uppercase tracking-wide text-slate-500">Tools</div>
  <div class="grid grid-cols-3 gap-2">
    <div class="flex flex-col items-center gap-1">
      <button 
        class="w-6 h-6 rounded flex items-center justify-center {tool.kind === 'erase' ? 'bg-slate-900 text-white' : 'bg-white border hover:bg-slate-50'}"
        on:click={() => onToolChange({ kind: 'erase' })}
        title="Erase"
      >
        <Eraser class="w-5 h-5" />
      </button>
      <span class="text-[10px] text-slate-600">erase</span>
    </div>
    <div class="flex flex-col items-center gap-1">
      <button 
        class="w-6 h-6 rounded flex items-center justify-center {tool.kind === 'setJorj' ? 'bg-slate-900 text-white' : 'bg-white border hover:bg-slate-50'}"
        on:click={() => onToolChange({ kind: 'setJorj' })}
        title="Set Jorj"
      >
        <Crosshair class="w-5 h-5" />
      </button>
      <span class="text-[10px] text-slate-600">set jorj</span>
    </div>
    <div class="flex flex-col items-center gap-1">
      <button 
        class="w-6 h-6 rounded flex items-center justify-center {tool.kind === 'toggle' && tool.flag === 'grindstone' ? 'bg-slate-900 text-white' : 'bg-white border hover:bg-slate-50'}"
        on:click={() => onToolChange({ kind: 'toggle', flag: 'grindstone' })}
        title="Toggle Grindstone"
      >
        <Gem class="w-5 h-5" />
      </button>
      <span class="text-[10px] text-slate-600">grindstone</span>
    </div>
  </div>
  <div class="grid grid-cols-3 gap-2">
    <div class="flex flex-col items-center gap-1">
      <button 
        class="w-6 h-6 rounded flex items-center justify-center {tool.kind === 'toggle' && tool.flag === 'chest' ? 'bg-slate-900 text-white' : 'bg-white border hover:bg-slate-50'}"
        on:click={() => onToolChange({ kind: 'toggle', flag: 'chest' })}
        title="Toggle Chest"
      >
        <Target class="w-5 h-5" />
      </button>
      <span class="text-[10px] text-slate-600">chest</span>
    </div>
    <div class="flex flex-col items-center gap-1">
      <button 
        class="w-6 h-6 rounded flex items-center justify-center {tool.kind === 'obstacle' ? 'bg-slate-900 text-white' : 'bg-white border hover:bg-slate-50'}"
        on:click={() => onToolChange({ kind: 'obstacle', chainGate: chainGate })}
        title="Place Obstacle"
      >
        <AlertTriangle class="w-5 h-5" />
      </button>
      <span class="text-[10px] text-slate-600">obstacle</span>
    </div>
  </div>

    <div class="mt-3 text-xs uppercase tracking-wide text-slate-500">Flags</div>
  <div class="grid grid-cols-2 gap-2">
    <div class="flex flex-col items-center gap-1">
      <button 
        class="w-6 h-6 rounded flex items-center justify-center {tool.kind === 'toggle' && tool.flag === 'angry' ? 'bg-slate-900 text-white' : 'bg-white border hover:bg-slate-50'}"
        on:click={() => onToolChange({ kind: 'toggle', flag: 'angry' })}
        title="Toggle Angry"
      >
        <AlertTriangle class="w-5 h-5" />
      </button>
      <span class="text-[10px]">angry</span>
    </div>
    <div class="flex flex-col items-center gap-1">
      <button 
        class="w-6 h-6 rounded flex items-center justify-center {tool.kind === 'toggle' && tool.flag === 'key' ? 'bg-slate-900 text-white' : 'bg-white border hover:bg-slate-50'}"
        on:click={() => onToolChange({ kind: 'toggle', flag: 'key' })}
        title="Toggle Key"
      >
        <KeyRound class="w-5 h-5" />
      </button>
      <span class="text-[10px]">key</span>
    </div>
  </div>

  <div class="mt-3 text-xs uppercase tracking-wide text-slate-500">Enemies</div>
  <div class="grid grid-cols-3 gap-2 mt-2">
    {#each COLORS as c}
      <div class="flex flex-col items-center gap-1">
        <button 
          class="w-6 h-6 rounded relative {tool.kind === 'paint' && tool.color === c ? 'ring-2 ring-slate-900' : 'bg-white border hover:bg-slate-50'}"
          on:click={() => onToolChange({ kind: 'paint', color: c })}
          title="Paint {c}"
          aria-label="Paint {c}"
        >
          <div class="w-full h-full rounded {cellBg(c)}"></div>
          {#if tool.kind === 'paint' && tool.color === c}
            <div class="absolute inset-0 flex items-center justify-center">
              <svg class="w-4 h-4 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
          {/if}
        </button>
        <span class="text-[10px] text-slate-600">{c}</span>
      </div>
    {/each}
  </div>
  <div class="grid grid-cols-3 gap-2">
    <div class="flex flex-col items-center gap-1">
      <button 
        class="w-6 h-6 rounded flex items-center justify-center {tool.kind === 'enemy' && tool.type === 'jerk' ? 'bg-slate-900 text-white' : 'bg-white border hover:bg-slate-50'}"
        on:click={() => onToolChange({ kind: 'enemy', type: 'jerk' })}
        title="Place Jerk (8-directional hit range)"
      >
        <ShieldQuestion class="w-5 h-5" />
      </button>
      <span class="text-[10px]">jerk</span>
    </div>
  </div>

  <div class="grid grid-cols-2 gap-2 items-center mt-1">
    <label for="avoidEnemies">Avoid enemies</label>
    <button 
      id="avoidEnemies"
      class="px-2 py-1 rounded text-xs {board.avoidEnemies ? 'bg-slate-900 text-white' : 'bg-white border'}"
      on:click={() => board.avoidEnemies = !board.avoidEnemies}
    >
      {board.avoidEnemies ? 'ON' : 'OFF'}
    </button>
  </div>
  <div class="grid grid-cols-2 gap-2 items-center mt-1">
    <label for="chainGate">Chain gate</label>
    <input id="chainGate" type="number" min="1" class="px-2 py-1 border rounded" bind:value={chainGate} />
  </div>

  <div class="mt-3 flex items-center gap-2">
    <button class="w-full px-3 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 flex items-center justify-center gap-2" on:click={onRun}>
      <Swords class="w-4 h-4" />
      Find Best Move
    </button>
    <button class="w-full px-3 py-2 border rounded hover:bg-slate-50" on:click={onClear}>Clear</button>
  </div>
</div>

