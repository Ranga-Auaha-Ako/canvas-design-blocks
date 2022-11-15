<script lang="ts">
  import Grid from "$lib/grid/grid";
  import Portal from "$lib/portal/portal.svelte";
  import RowMenu from "./rowMenu.svelte";

  export let grid: Grid;
</script>

{#each $grid as row, index (row.id)}
  <Portal target={row.node} bogus={true}>
    <RowMenu {row} />
  </Portal>
{/each}
