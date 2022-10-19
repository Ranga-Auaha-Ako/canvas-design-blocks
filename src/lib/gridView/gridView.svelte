<script lang="ts">
  import { getContext } from "svelte";
  import GridManager from "../grid";
  import { rowTemplates } from "../grid/rowLayouts";

  const gridManager: GridManager = getContext("gridManager");
  import GridViewRow from "./gridViewRow.svelte";

  const addRow = (index: number) => {
    gridManager.addRow(rowTemplates["1/2 + 1/2"], index);
  };
</script>

<div class="gridView">
  <p>Rows: {$gridManager.length}</p>
  {#each $gridManager as row, i}
    <GridViewRow
      {row}
      showAppendButton={i == $gridManager.length - 1}
      on:addRow={(e) => {
        addRow(i + (e.detail.offset || 0));
      }}
    />
  {/each}
</div>

<style lang="postcss">
  .gridView {
    @apply flex flex-col gap-2 relative;
  }
</style>
