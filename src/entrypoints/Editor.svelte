<script lang="ts">
  import GridMenu from "$lib/components/editor/gridMenu.svelte";
  import type { GridManager, stateObject } from "$lib/grid/gridManager";
  import Portal from "$lib/portal/portal.svelte";
  import preventBubble from "$lib/util/preventBubble";
  import { createEventDispatcher, onMount } from "svelte";
  const dispatch = createEventDispatcher();

  export let state: stateObject;
  export let grids: GridManager;

  $: open = state.showInterface;

  let container: Element;

  onMount(() => {
    preventBubble(container);
  });
</script>

<div
  data-mce-bogus="all"
  contenteditable="false"
  bind:this={container}
  class="cgb-app-container"
>
  {#each $grids as grid (grid.id)}
    <GridMenu {grid} />
  {/each}
</div>

<style lang="postcss">
  .cgb-app-container {
    @apply hidden;
  }
</style>
