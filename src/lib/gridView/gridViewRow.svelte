<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Writable } from "svelte/store";
  import Row from "../grid/row";
  import GridViewColumn from "./gridViewColumn.svelte";

  export let showPrependButton = true;
  export let showAppendButton = false;

  export let row: Row;
  $: columns = row.columns;

  const dispatch = createEventDispatcher();
</script>

<div class="gridViewRow">
  {#if showPrependButton}
    <div class="actions prepend">
      <button on:click={() => dispatch("addRow", { offset: 0 })}>+</button>
    </div>
  {/if}
  {#each $columns as column}
    <GridViewColumn {column} />
  {/each}
  {#if showAppendButton}
    <div class="actions append">
      <button on:click={() => dispatch("addRow", { offset: 1 })}>+</button>
    </div>
  {/if}
</div>

<style lang="postcss">
  .actions {
    @apply absolute w-full left-0;
    &.prepend {
      @apply -top-2.5;
    }
    &.append {
      @apply -bottom-2.5;
    }
    & button {
      @apply left-0 right-0 mx-auto h-5 w-5;
      @apply leading-none flex items-center justify-center align-middle;
      @apply rounded-full border-0 bg-uni-blue shadow text-white;
    }
  }
  .gridViewRow {
    @apply flex relative gap-2;
    @apply bg-slate-200 p-2 rounded-lg;
  }
</style>
