<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade, slide } from "svelte/transition";
  import Row from "$lib/grid/row";
  import GridAddButton from "./gridAddButton.svelte";
  import GridLayouts from "./gridLayouts.svelte";
  import GridViewColumn from "./gridViewColumn.svelte";

  export let showPrependButton = true;
  export let showAppendButton = false;

  export let row: Row;
  $: columns = row.columns;

  let showLayoutPicker = false;
  let showButtons = false;
  let prependPicking = false;
  let appendPicking = false;

  const dispatch = createEventDispatcher();
</script>

<button
  class="gridViewRow"
  transition:slide|local
  contenteditable="false"
  on:click={() => (showLayoutPicker = !showLayoutPicker)}
  on:mouseover={() => (showButtons = true)}
  on:focus={() => (showButtons = true)}
  on:mouseout={() => (showButtons = false)}
  on:blur={() => (showButtons = false)}
>
  {#if (showButtons && showPrependButton) || prependPicking}
    <div class="actions prepend" transition:fade>
      <GridAddButton on:addRow bind:expanded={prependPicking} />
    </div>
  {/if}
  {#each $columns as column}
    <GridViewColumn {column} />
  {/each}
  {#if showButtons}
    <div class="row-delete" transition:fade>
      <button
        class="cgb-delete-row"
        on:click|stopPropagation={() => {
          row.delete();
        }}
      >
        <i class="icon-Line icon-trash " aria-hidden="true" />
      </button>
    </div>
  {/if}
  {#if (showButtons && showAppendButton) || appendPicking}
    <div class="actions append" transition:fade>
      <GridAddButton on:addRow append={true} bind:expanded={appendPicking} />
    </div>
  {/if}
  {#if showLayoutPicker}
    <GridLayouts
      on:cancel={() => {
        showLayoutPicker = false;
      }}
      on:add={(e) => dispatch("setLayout", { template: e.detail })}
    />
  {/if}
</button>

<style lang="postcss">
  .actions {
    @apply absolute w-full left-0;
    &.prepend {
      @apply -top-2.5;
    }
    &.append {
      @apply -bottom-2.5;
    }
  }
  .gridViewRow {
    @apply flex relative gap-2;
    @apply cursor-pointer p-0 border-0 bg-transparent;
  }

  .row-delete {
    @apply absolute -right-1 top-0 bottom-0 h-full flex items-center;
    & button {
      @apply h-7 w-7;
      @apply rounded-full  border-none outline outline-1 transition;
      @apply text-uni-color-red outline-uni-color-red bg-white;
      &:hover {
        @apply bg-uni-color-red text-white;
      }
    }
  }
</style>
