<script lang="ts">
  import { Gem } from 'lucide-svelte';
  import type { BoardModel, Vec, Tool } from '../types';
  import { getTile, cellBg } from '../utils';

  export let board: BoardModel;
  export let tool: Tool;
  export let cellPx: number;
  export let result: any;
  export let onCellClick: (r: number, c: number) => void;

  $: resultPathSet = result ? new Set(result.path.map((p: Vec) => `${p.r},${p.c}`)) : new Set();
</script>

<div class="relative">
  <div class="grid border rounded-lg overflow-hidden" style="grid-template-columns: repeat({board.cols}, {cellPx}px); grid-template-rows: repeat({board.rows}, {cellPx}px);">
    {#each Array.from({ length: board.rows }) as _, r}
      {#each Array.from({ length: board.cols }) as _, c}
        {@const t = getTile(board, { r, c })}
        {@const isJorj = board.jorj.r === r && board.jorj.c === c}
        {@const isPath = result && resultPathSet.has(`${r},${c}`)}
        <div 
          class="relative border border-white/40 {cellBg(t?.color)} cursor-pointer hover:ring-2 hover:ring-dashed hover:ring-slate-600 hover:ring-inset transition-all flex items-center justify-center"
          style="width: {cellPx}px; height: {cellPx}px"
          on:click={() => onCellClick(r, c)}
          title="{r},{c}"
          role="button"
          tabindex="0"
          on:keydown={(e) => e.key === 'Enter' && onCellClick(r, c)}
        >
          <div class="absolute top-1 left-1 flex gap-1">
            {#if t?.grindstone}
              <span class="px-1.5 py-0.5 text-[10px] rounded bg-black/70 text-white leading-none flex items-center gap-1" title="Grindstone">
                <Gem class="w-3 h-3" />
              </span>
            {/if}

            {#if t?.chest}
              <span class="px-1.5 py-0.5 text-[10px] rounded bg-black/70 text-white leading-none" title="Chest">CH</span>
            {/if}
            {#if t?.key}
              <span class="px-1.5 py-0.5 text-[10px] rounded bg-black/70 text-white leading-none" title="Key">KEY</span>
            {/if}
            {#if t?.jerk}
              <span class="px-1.5 py-0.5 text-[10px] rounded bg-black/70 text-white leading-none" title="Jerk (8-directional: N,S,E,W,NE,SE,SW,NW)">J1</span>
            {/if}
            {#if t?.angry}
              <span class="px-1.5 py-0.5 text-[10px] rounded bg-black/70 text-white leading-none" title="Angry (4-directional: N,S,E,W)">A1</span>
            {/if}
            {#if t?.chainGate}
              <span class="px-1.5 py-0.5 text-[10px] rounded bg-black/70 text-white leading-none" title="Chain Gate: {t.chainGate}">CG{t.chainGate}</span>
            {/if}
          </div>
          {#if isJorj}
            <div class="absolute inset-1 rounded-full bg-slate-800/80 flex items-center justify-center text-white text-[10px] font-bold">J</div>
          {/if}
          {#if isPath}
            <div class="absolute inset-0 ring-2 ring-slate-800/60 pointer-events-none"></div>
          {/if}
        </div>
      {/each}
    {/each}
  </div>
  {#if result}
    <svg class="absolute inset-0 pointer-events-none" width="100%" height="100%">
      <path 
        d={result.path.map((p: Vec, i: number) => `${i === 0 ? 'M' : 'L'} ${(p.c + 0.5) * cellPx} ${(p.r + 0.5) * cellPx}`).join(' ')} 
        stroke-width="4" 
        fill="none" 
        stroke="currentColor" 
        class="text-slate-800/70"
      />
      {#each result.path as p, idx}
        <g>
          <circle cx={(p.c + 0.5) * cellPx} cy={(p.r + 0.5) * cellPx} r="12" class="fill-slate-900" />
          <text x={(p.c + 0.5) * cellPx} y={(p.r + 0.5) * cellPx + 4} text-anchor="middle" class="fill-white text-[10px] font-bold">{idx + 1}</text>
        </g>
      {/each}
    </svg>
  {/if}
</div>
