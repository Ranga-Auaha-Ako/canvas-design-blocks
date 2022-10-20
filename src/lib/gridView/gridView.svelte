<script lang="ts">
  import { getContext } from "svelte";
  import { get } from "svelte/store";
  import GridManager from "../grid";
  import { RowLayout, rowTemplates } from "../grid/rowLayouts";

  const gridManager: GridManager = getContext("gridManager");
  import GridViewRow from "./gridViewRow.svelte";

  const addRow = (index: number, template: RowLayout) => {
    gridManager.addRow(template, index);
  };

  const setRowLayout = (index: number, template: RowLayout) => {
    get(gridManager)[index].setLayout(template);
  };
</script>

<div class="gridView">
  {#each $gridManager as row, i (row.id)}
    <GridViewRow
      {row}
      showAppendButton={i == $gridManager.length - 1}
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
    @apply flex flex-col gap-2 relative;
  }
</style>
