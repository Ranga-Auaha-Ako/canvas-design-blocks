<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { Writable, writable } from "svelte/store";
  import Grid from "./lib/grid";
  import { setContext } from "svelte";
  import GridView from "./lib/gridView/gridView.svelte";
  import GridLayouts from "./lib/gridView/gridLayouts.svelte";
  import { fade, fly, slide } from "svelte/transition";
  import GridManager, { stateObject } from "./lib/grid/gridManager";
  import { clickOutside } from "svelte-use-click-outside";

  export let state: stateObject = {
    showInterface: writable(false),
  };

  export let grids = new GridManager(state);

  setContext("grids", grids);

  $: showInterface = state.showInterface;

  onMount(() => {
    // Two situations might occur:
    // -------- No need to make a new grid:
    //   1. Page already has a grid
    // -------- Need to make a new grid:
    //   X (NOT IN USE). Page is empty (auto-init grid)
    //   3. Page has content. We can add a grid at the cursor position when asked
    const editor = window.tinymce.activeEditor;
    // // If page is empty, we can auto-init a grid
    // if (editor.dom.isEmpty(editor.dom.getRoot())) {
    //   grids.add(Grid.create(grids.state));
    // }
  });

  const dispatch = createEventDispatcher();

  let showRowMenu = false;

  $: hasGrid = $grids.length > 0;
</script>

<div
  class="sidebar-container"
  class:active={$showInterface}
  use:clickOutside={() => {
    if ($showInterface) state.showInterface.set(false);
  }}
>
  <div class="header">
    <div class="close">
      <button
        class="Button Button--icon-action"
        on:click={() => {
          $showInterface = false;
        }}
      >
        <i class="icon-Line icon-x" aria-hidden="true" />
      </button>
    </div>
    <h3>Canvas Grid Builder</h3>
  </div>
  <div class="grid-details" transition:fade>
    <p>
      Welcome to the new Canvas Grid Editor. To begin, select an existing grid
      on the page by clicking the outline, or click the button below to create a
      grid.
    </p>
    <div class="existing-grids">
      {#each $grids as grid, idx (grid.id)}
        <GridView {grid} />
        {#if idx < $grids.length - 1}
          <span class="space-inbetween">&ctdot;</span>
        {/if}
      {/each}
    </div>
    <button
      class="Button Button--primary"
      on:click={() => {
        grids.add(Grid.create(grids.state, undefined, true), true);
      }}>Create Grid</button
    >
  </div>
</div>

<style lang="postcss">
  .sidebar-container {
    --sidebar-width: 26rem;
    @apply fixed w-full h-full border-uni-blue top-0 right-0 transition duration-300;
    @apply z-50 bg-white;
    @apply p-4 px-8;
    @apply border-0 border-solid border-l-2;
    @apply grid gap-4;
    @apply overflow-y-auto max-h-screen box-border;
    grid-template-areas: "header" "content";
    grid-template-rows: auto 1fr;
    max-width: var(--sidebar-width);
    transform: translateX(100%);
    & .header {
      grid-area: header;
      @apply grid items-center gap-3;
      @apply border-solid border-0 border-b border-uni-gray-200;
      grid-template-areas: "back title close" "hr hr hr";
      grid-template-columns: auto 1fr auto;
      & h3 {
        grid-area: title;
      }
      & .close {
        grid-area: close;
      }
      & .back {
        grid-area: back;
      }
    }
    & .grid-details {
      grid-area: content;
    }
    &.active {
      transform: translateX(0);
    }
    & .existing-grids {
      @apply flex flex-col;
      & .space-inbetween {
        @apply text-center text-gray-400 font-bold leading-none m-0 select-none;
      }
    }
  }
  .no-rows {
    @apply relative;
  }
</style>
