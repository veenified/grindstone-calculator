<script lang="ts">
  import { Download, Upload, Save, RotateCcw } from 'lucide-svelte';
  import type { BoardModel } from '../types';

  export let onExport: () => void;
  export let onImport: (event: Event) => void;
  export let board: BoardModel;

  let showToast = false;
  let toastMessage = '';
  let toastType: 'success' | 'error' = 'success';

  function showToastMessage(message: string, type: 'success' | 'error' = 'success') {
    toastMessage = message;
    toastType = type;
    showToast = true;
    setTimeout(() => showToast = false, 3000);
  }

  function saveToLocalStorage() {
    try {
      localStorage.setItem('grindstone-board', JSON.stringify(board));
      showToastMessage('Board saved to local storage!', 'success');
    } catch (error) {
      showToastMessage('Failed to save board to local storage', 'error');
    }
  }

  function recallFromLocalStorage() {
    try {
      const savedBoard = localStorage.getItem('grindstone-board');
      if (!savedBoard) {
        showToastMessage('No saved board found in local storage', 'error');
        return;
      }
      
      const parsedBoard = JSON.parse(savedBoard);
      if (typeof parsedBoard?.rows === 'number' && typeof parsedBoard?.cols === 'number' && parsedBoard?.jorj && parsedBoard?.tiles && parsedBoard?.weights) {
        // Update the board through a callback
        onRecall(parsedBoard);
        showToastMessage('Board loaded from local storage!', 'success');
      } else {
        showToastMessage('Invalid saved board format', 'error');
      }
    } catch (error) {
      showToastMessage('Failed to load board from local storage', 'error');
    }
  }

  export let onRecall: (board: BoardModel) => void;
</script>

<div class="flex items-center justify-between gap-3">
  <h1 class="text-2xl font-bold text-white">Grindstone Calculator</h1>
  <div class="flex gap-2">
    <button class="px-3 py-2 rounded-md border bg-white hover:bg-slate-50 flex items-center gap-2" on:click={saveToLocalStorage} title="Save board to local storage">
      <Save class="w-4 h-4" />
      Save
    </button>
    <button class="px-3 py-2 rounded-md border bg-white hover:bg-slate-50 flex items-center gap-2" on:click={recallFromLocalStorage} title="Load board from local storage">
      <RotateCcw class="w-4 h-4" />
      Recall
    </button>
    <button class="px-3 py-2 rounded-md border bg-white hover:bg-slate-50 flex items-center gap-2" on:click={onExport} title="Export board JSON">
      <Download class="w-4 h-4" />
      Export
    </button>
    <label class="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-slate-50">
      <Upload class="w-4 h-4" />
      <span>Import</span>
      <input type="file" class="hidden" accept="application/json" on:change={onImport} />
    </label>
  </div>
</div>

<!-- Toast Notification -->
{#if showToast}
  <div class="fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out">
    <div class="px-4 py-3 rounded-lg shadow-lg text-white {toastType === 'success' ? 'bg-green-600' : 'bg-red-600'}">
      {toastMessage}
    </div>
  </div>
{/if}
