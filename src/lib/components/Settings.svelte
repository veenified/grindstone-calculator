<script lang="ts">
  import type { BoardModel, Weights } from '../types';

  export let board: BoardModel;
  export let result: any;
</script>

<div class="flex flex-col gap-4">
  <div class="bg-white rounded-lg border shadow-sm">
    <div class="p-6 border-b">
      <h2 class="text-lg font-semibold">Board Settings</h2>
    </div>
    <div class="p-6 space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label for="rows">Rows</label>
          <input id="rows" type="number" class="w-full px-2 py-1 border rounded" bind:value={board.rows} min="3" />
        </div>
        <div>
          <label for="cols">Cols</label>
          <input id="cols" type="number" class="w-full px-2 py-1 border rounded" bind:value={board.cols} min="3" />
        </div>
      </div>
      <div>
        <label for="jorj">Jorj (r,c)</label>
        <div class="grid grid-cols-2 gap-2">
          <input id="jorj-r" type="number" class="px-2 py-1 border rounded" bind:value={board.jorj.r} min="0" max={board.rows - 1} />
          <input id="jorj-c" type="number" class="px-2 py-1 border rounded" bind:value={board.jorj.c} min="0" max={board.cols - 1} />
        </div>
      </div>
    </div>
  </div>

  <div class="bg-white rounded-lg border shadow-sm">
    <div class="p-6 border-b">
      <h2 class="text-lg font-semibold">Scoring Weights</h2>
    </div>
    <div class="p-6 space-y-2">
      {#each [['Chain length','w_len'],['Grindstone thresholds','w_gs'],['Risk (angry adj.)','w_risk'],['Objectives (chest/key)','w_obj']] as [label, key]}
        <div class="grid grid-cols-2 gap-2 items-center">
          <label for={key}>{label}</label>
          <input id={key} type="number" step="0.1" class="px-2 py-1 border rounded" bind:value={board.weights[key as keyof Weights]} />
        </div>
      {/each}
    </div>
  </div>

  <div class="bg-white rounded-lg border shadow-sm">
    <div class="p-6 border-b">
      <h2 class="text-lg font-semibold">Result</h2>
    </div>
    <div class="p-6">
      {#if !result}
        <div class="text-slate-500 text-sm">Run the calculator to see the best path.</div>
      {:else}
        <div class="space-y-2 text-sm">
          <div><span class="font-semibold">Score:</span> {result.score.toFixed(2)}</div>
          <div class="grid grid-cols-2 gap-2">
            <div>Chain length: <span class="font-semibold">{result.breakdown.L}</span></div>
            <div>Grindstone thresholds: <span class="font-semibold">{result.breakdown.gs}</span></div>
            <div>Risk (angry adj.): <span class="font-semibold">{result.breakdown.risk}</span></div>
            <div>Objectives hit: <span class="font-semibold">{result.breakdown.obj}</span></div>
            <div>Obstacles destroyed: <span class="font-semibold">{result.breakdown.destroyedObstacles || 0}</span></div>
          </div>
          <div class="mt-2">
            <div class="font-semibold mb-1">Path (r,c):</div>
            <div class="flex flex-wrap gap-1">
              {#each result.path as p, i}
                <span class="px-1.5 py-0.5 bg-slate-100 rounded text-xs">{i+1}: ({p.r},{p.c})</span>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div class="bg-white rounded-lg border shadow-sm">
    <div class="p-6 border-b">
      <h2 class="text-lg font-semibold">Notes</h2>
    </div>
    <div class="p-6 text-xs text-slate-600 space-y-2">
      <p>Place <strong>Jerks</strong> or <strong>Angry enemies</strong> with directional hit ranges. With <em>Avoid enemies</em> ON, the search will avoid ending chains near angry enemies (risk penalty), but can still step onto enemy cells during the chain. Range visual is shown on the badge (e.g., J1 for Jerk with 8-directional 1-cell range, A1 for Angry with 4-directional 1-cell range).</p>
      <p><strong>Note:</strong> The algorithm now allows stepping onto enemy cells during chains, but still penalizes ending chains near angry enemies. This enables more strategic pathfinding while maintaining risk awareness.</p>
      <p>Modeled rules: 8-direction movement; chain same color; grindstone switch (also allowed through colorless grindstone); no revisits; landing risk penalized by adjacent Angry tiles; objectives give bonuses.</p>
      <p>Not yet modeled: moving enemies, per-turn anger timers, HP-gated chains, item/gear usage, exit/greed logic.</p>
    </div>
  </div>
</div>
