<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import GridManager, { stateObject } from "$lib/elements/grid/gridManager";
  import preventBubble from "$lib/util/preventBubble";
  import IconWhite from "$assets/brand/Icon_White.svg";
  import { slide } from "svelte/transition";
  const dispatch = createEventDispatcher();
  import { version } from "$lib/util/constants";
  import Grid from "$lib/elements/grid/grid";
  import ElementPanel from "$lib/toolbar/elementPanel.svelte";

  export let state: stateObject | undefined;
  export let grids: GridManager | undefined;

  $: open = state?.showInterface;

  let container: HTMLElement;
  $: if (container) preventBubble(container);

  const addGrid = () => {
    if (!grids) return;
    const newGrid = Grid.create(grids.state, grids, false, grids.editor, true);
    grids.add(newGrid);
  };
</script>

<div bind:this={container} class="cgb-toolbar cgb-component">
  <button
    class="cgb-openButton"
    title="Canvas Grid Builder"
    class:cgb-active={$open}
    on:click={() => {
      $open = !$open;
      dispatch("open");
    }}
  >
    <div class="details">Visual Editor</div>
    <img src={IconWhite} alt="" />
  </button>

  {#if $open && $grids}
    <div class="toolbar-menu" transition:slide>
      <ElementPanel on:add={addGrid}>
        <svelte:fragment slot="name">Add Grid</svelte:fragment>
      </ElementPanel>

      <div class="version">
        v{version}<i>b</i>
      </div>
    </div>
  {/if}
</div>

<style lang="postcss">
  .cgb-toolbar {
    display: contents;
  }
  .cgb-openButton {
    @apply rounded-sm w-full h-8 py-1 px-2;
    @apply flex flex-row items-center;
    @apply transition text-sm border border-uni-gray-200 rounded;
    &.cgb-active {
      @apply bg-uni-blue text-white border-2 border-uni-blue;
    }
    & img {
      @apply h-full p-0.5;
    }
    & .details {
      @apply flex-grow text-left;
    }
  }

  .toolbar-menu {
    @apply border-uni-gray-200 border rounded mt-2;
    & .version {
      @apply text-xs text-right p-2;
      & i {
        @apply text-xs;
      }
    }
  }
</style>
