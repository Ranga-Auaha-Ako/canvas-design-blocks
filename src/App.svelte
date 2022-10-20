<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { writable } from "svelte/store";
  import GridManager from "./lib/grid";
  import { setContext } from "svelte";
  import GridView from "./lib/gridView/gridView.svelte";

  export let show = writable(false);

  const gridManager = new GridManager({ editorVisible: show });
  setContext("gridManager", gridManager);

  const dispatch = createEventDispatcher();

  $: hasGrid = gridManager.isGrid;
</script>

<div class="sidebar-container" class:active={$show}>
  <div class="close">
    <button
      class="Button Button--icon-action"
      on:click={() => {
        $show = false;
      }}>&times;</button
    >
  </div>
  <h3>Canvas Grid Editor</h3>
  <hr />
  {#if !$hasGrid}
    <p>
      Welcome to the new Canvas Grid Editor. To begin, click the button below to
      convert this page to be used with the editor.
    </p>
    <button
      class="btn btn-primary"
      on:click={() => {
        gridManager.makeGrid();
      }}>Create Grid</button
    >
  {:else}
    <GridView />
  {/if}
</div>

<style lang="postcss">
  .close {
    @apply absolute top-0 right-0 p-8;
  }
  .sidebar-container {
    --sidebar-width: 26rem;
    @apply fixed w-full h-full border-uni-blue top-0 right-0 transition duration-300;
    @apply p-4 px-8;
    @apply border-0 border-solid border-l-2;
    max-width: var(--sidebar-width);
    transform: translateX(100%);
    &.active {
      transform: translateX(0);
    }
  }
</style>
