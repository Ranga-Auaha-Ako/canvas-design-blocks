<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { Writable, writable } from "svelte/store";
  import Grid from "$lib/grid/grid";
  import { setContext } from "svelte";
  import GridView from "$lib/components/sidebar/gridView/gridView.svelte";
  import { fade, fly, slide } from "svelte/transition";
  import GridManager, { stateObject } from "$lib/grid/gridManager";
  import { clickOutside } from "svelte-use-click-outside";
  import { version } from "$lib/util/constants";
  import preventBubble from "$lib/util/preventBubble";

  export let state: stateObject = {
    showInterface: writable(false),
  };

  export let grids = new GridManager(state);

  setContext("grids", grids);

  $: showInterface = state.showInterface;
</script>

<div
  class="sidebar-container"
  class:active={$showInterface}
  use:clickOutside={() => {
    if ($showInterface) state.showInterface.set(false);
  }}
  use:preventBubble={true}
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
      Welcome to the beta (version {version}) release of Canvas Grid Editor. To
      begin, select an existing grid on the page by clicking the outline, or
      click the button below to create a grid.
    </p>
    <div class="existing-grids">
      {#if $grids.length}
        {#each $grids as grid, idx (grid.id)}
          <GridView {grid} />
          {#if idx < $grids.length - 1}
            <span class="space-inbetween">&ctdot;</span>
          {/if}
        {/each}
      {:else}
        <div class="noGrids">
          <p>
            No grids found on this page. To create a grid, click the button
            below.
          </p>
        </div>
      {/if}
    </div>
    <button
      class="Button Button--primary"
      on:click={() => {
        grids.add(Grid.create(grids.state, grids, true), true);
      }}>Create Grid</button
    >
  </div>
</div>

<style lang="postcss">
  .sidebar-container {
    --sidebar-width: 26rem;
    @apply fixed w-full h-full border-uni-blue top-0 right-0 transition duration-300 shadow-md;
    @apply z-50 bg-white;
    @apply pb-4 px-8;
    @apply border-0 border-solid border-l-2;
    @apply grid gap-4;
    @apply overflow-y-auto max-h-screen box-border;
    grid-template-areas: "header" "content";
    grid-template-rows: auto 1fr;
    max-width: var(--sidebar-width);
    transform: translateX(100%);
    & .header {
      grid-area: header;
      @apply grid items-center gap-3 sticky top-0 pt-4 bg-white z-50;
      @apply border-solid border-0 border-b border-uni-gray-200;
      grid-template-areas: "title close" "hr hr";
      grid-template-columns: 1fr auto;
      & h3 {
        grid-area: title;
      }
      & .close {
        grid-area: close;
      }
    }
    & .grid-details {
      grid-area: content;
      @apply grid gap-4 justify-items-center;
      grid-template-rows: auto 1fr auto;

      & .existing-grids {
        @apply flex flex-col w-full;
        & .noGrids {
          @apply md:p-10 p-4 bg-gray-100 border-solid border-2 border-gray-300 rounded italic text-center;
        }
        & .space-inbetween {
          @apply text-center text-gray-400 font-bold leading-none m-0 select-none;
        }
      }
    }
    &.active {
      transform: translateX(0);
    }
  }
</style>
