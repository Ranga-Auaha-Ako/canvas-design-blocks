<script lang="ts">
  import Row from "$lib/grid/row";
  import { get } from "svelte/store";

  export let row: Row;
  $: columns = row.columns;

  let activeColumn = 0;
</script>

<div class="colPicker">
  {#each $columns as col}
    <div
      class="col"
      style:--gridViewColWidth={`${(get(col.width).lg / 12) * 100}%`}
    />
  {/each}
</div>

<style lang="postcss">
  h5 {
    @apply text-center w-full font-bold text-sm;
  }
  .colPicker {
    @apply flex gap-2 p-2 w-full h-10;
    & .col {
      @apply bg-uni-blue-light rounded;
      width: var(--gridViewColWidth);
    }
  }
</style>
