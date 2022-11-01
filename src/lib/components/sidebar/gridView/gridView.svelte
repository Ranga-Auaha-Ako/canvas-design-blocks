<script lang="ts">
  import { getContext } from "svelte";
  import { debug } from "svelte/internal";
  import { get } from "svelte/store";
  import { fade } from "svelte/transition";
  import Grid from "$lib/grid";
  import { RowLayout, rowTemplates } from "$lib/grid/rowLayouts";
  import GridLayouts from "./gridLayouts.svelte";
  import Portal from "$lib/portal/portal.svelte";

  export let grid: Grid;

  import GridViewRow from "./gridViewRow.svelte";

  const addRow = (index: number, template: RowLayout) => {
    grid.addRow(template, index);
  };

  const setRowLayout = (index: number, template: RowLayout) => {
    get(grid)[index].setLayout(template);
  };
</script>

<div class="gridView">
  {#each $grid as row, i (row.id)}
    <GridViewRow
      {row}
      showAppendButton={i == $grid.length - 1}
      on:addRow={(e) => {
        addRow(i + (e.detail.offset || 0), e.detail.template);
      }}
      on:setLayout={(e) => {
        setRowLayout(i, e.detail.template);
      }}
    />
  {/each}
</div>

<style lang="postcss">
  .gridView {
    @apply flex flex-col gap-2 relative p-2 m-2;
    @apply bg-slate-200 rounded;
  }
</style>
