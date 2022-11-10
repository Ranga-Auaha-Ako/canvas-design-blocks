<script lang="ts">
  import Grid from "$lib/grid/grid";
  import Portal from "$lib/portal/portal.svelte";
  import preventBubble from "$lib/util/preventBubble";
  import { onMount } from "svelte";
  import "./rowMenu.wc.svelte";

  export let grid: Grid;

  let gridMenuWrapper: HTMLElement;

  onMount(() => {
    preventBubble(gridMenuWrapper);
  });
</script>

{#each $grid as row, index (row.id)}
  <Portal target={row.node}>
    <div
      class="wrapper"
      contenteditable="false"
      unselectable={true}
      draggable="false"
      bind:this={gridMenuWrapper}
      data-mce-bogus="all"
    >
      <cgb-rowmenu {row} />
    </div>
  </Portal>
{/each}

<style lang="postcss">
  .wrapper {
    @apply left-0 right-0 absolute z-10 pointer-events-none;
    top: -1.125rem; /* Centered in the gap between rows. Otherwise -top-3 for top of row*/
    height: 100%;
    pointer-events: none;
  }
</style>
