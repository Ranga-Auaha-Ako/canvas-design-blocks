<script lang="ts">
  import { get } from "svelte/store";
  import Grid from "$lib/grid/grid";
  import { RowLayout } from "$lib/grid/rowLayouts";
  import Portal from "$lib/portal/portal.svelte";
  import GridLayouts from "../sidebar/gridView/gridLayouts.svelte";
  import { onMount } from "svelte";
  import preventBubble from "$lib/util/preventBubble";
  import { fade, slide } from "svelte/transition";

  export let grid: Grid;

  // Either false or the id of the row to change layout for
  let showChangeLayout: string | false = false;
  let showAddRow: string | false = false;
  $: selectedRow = grid.selected;

  $: selectedRow.subscribe((row) => {
    showChangeLayout = false;
    showAddRow = false;
  });

  const addRow = (index: number, template?: RowLayout) => {
    const row = grid.addRow(template, index);
    showAddRow = false;
    grid.editor.selection.setCursorLocation();
  };

  const setRowLayout = (index: number, template: RowLayout) => {
    get(grid)[index].setLayout(template);
  };
</script>

{#each $grid as row, index (row.id)}
  <Portal target={row.node}>
    {#if $selectedRow === row.id || $selectedRow === true}
      <div
        class="wrapper"
        contenteditable="false"
        unselectable={true}
        data-mce-bogus="all"
        transition:fade={{ delay: 100, duration: 200 }}
      >
        <div class="gridMenu">
          <div class="actions">
            <!-- Delete Row -->
            <button
              title="Delete Row"
              class="delete"
              on:click={() => {
                row.delete();
              }}
            >
              &times;
            </button>
            <!-- Change Layout -->
            <button
              title="Change Layout"
              class="change"
              on:click={() => {
                showChangeLayout = showChangeLayout ? false : row.id;
                showAddRow = false;
              }}
            >
              &#8801;
            </button>
            <!-- Add above/below -->
            <button
              title="Add Row"
              class="addRow"
              on:click={() => {
                showAddRow = showAddRow ? false : row.id;
                showChangeLayout = false;
              }}
            >
              +
            </button>
          </div>
          {#if showAddRow === row.id}
            <div class="addRowSelect" transition:slide>
              <button
                title="Add Row Above"
                class="addAbove"
                on:click={() => addRow(index)}
                transition:fade
              >
                &#8593;
              </button>
              <button
                title="Add Row Below"
                class="addBelow"
                on:click={() => addRow(index + 1)}
                transition:fade
              >
                &#8595;
              </button>
            </div>
          {/if}
          {#if showChangeLayout === row.id}
            <div
              class="layoutConfig"
              contenteditable="false"
              unselectable={true}
              data-mce-bogus="all"
            >
              <GridLayouts
                on:add={(e) => {
                  setRowLayout(index, e.detail);
                  showChangeLayout = false;
                }}
              />
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </Portal>
{/each}

<style lang="postcss">
  .menu {
    @apply sticky top-2 px-2 py-0.5 h-6;
    @apply bg-uni-blue text-white rounded-full shadow;
  }
  .wrapper {
    @apply left-0 right-0 absolute z-10 pointer-events-none;
    top: -1.125rem; /* Centered in the gap between rows. Otherwise -top-3 for top of row*/
    height: 100%;
    pointer-events: none;
  }
  .gridMenu {
    @apply mx-auto w-fit max-w-full menu pointer-events-auto;

    & .actions {
      @apply flex items-center h-full;
    }
  }

  .addRowSelect {
    @apply flex items-center;
    @apply menu;
    @apply bg-uni-blue-light;
    @apply left-0 right-0 mx-auto w-fit;
  }

  .layoutConfig {
    @apply absolute top-7 mx-auto w-screen;
    @apply bg-uni-blue text-white rounded-full shadow;
    max-width: 18rem;
    left: -100vw;
    right: -100vw;
  }

  button {
    @apply bg-transparent text-white border-0;
  }
</style>
