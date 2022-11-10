<svelte:options tag="cgb-sidebar" />

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

  export let state: stateObject | undefined = {
    showInterface: writable(false),
  };

  export let grids: GridManager | undefined;

  $: showInterface = state?.showInterface;
  $: console.log($showInterface);

  onMount(() => {
    // Event listener to listen for clicks outside the sidebar
    document.addEventListener("click", (e) => {
      if (e.target && e.target instanceof HTMLElement) {
        if (e.target.closest("cgb-sidebar") === null) {
          if ($showInterface) state?.showInterface.set(false);
        }
      }
    });
  });

  const dispatch = createEventDispatcher();

  let showRowMenu = false;

  $: hasGrid = $grids && $grids.length > 0;
</script>

<div class="sidebar-container" class:active={$showInterface}>
  <div class="header">
    <div class="close">
      <button
        class="Button Button--icon-action"
        on:click={() => {
          $showInterface = false;
        }}
      >
        &times;
      </button>
    </div>
    <h3>Canvas Custom Elements</h3>
  </div>
  <div class="grid-details" transition:fade>
    <p>
      Welcome to the beta (version {version}) release of Canvas Grid Editor. To
      begin, select an existing grid on the page by clicking the outline, or
      click the button below to create a grid.
    </p>
    <button
      class="Button Button--primary w-full"
      on:click={() => {
        grids?.add(Grid.create(grids.state, undefined, true), true);
        $showInterface = false;
      }}>Create Grid</button
    >
  </div>
</div>

<style lang="postcss">
  @import "../app.postcss";
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
      grid-template-areas: "back title close" "hr hr hr";
      grid-template-columns: auto 1fr auto;
      & h3 {
        grid-area: title;
        @apply text-2xl my-0;
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
  }
  .no-rows {
    @apply relative;
  }
</style>
