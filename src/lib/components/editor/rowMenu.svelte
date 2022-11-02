<script lang="ts">
  import { get } from "svelte/store";
  import Grid from "$lib/grid/grid";
  import { RowLayout } from "$lib/grid/rowLayouts";
  import Portal from "$lib/portal/portal.svelte";
  import GridLayouts from "../sidebar/gridView/gridLayouts.svelte";
  import { onMount } from "svelte";
  import preventBubble from "$lib/util/preventBubble";
  import { fade, slide } from "svelte/transition";
  import Row from "$lib/grid/row";

  export let row: Row;

  let gridMenuWrapper: HTMLElement;

  onMount(() => {
    preventBubble(gridMenuWrapper);
  });

  // Either false or the id of the row to change layout for
  let showChangeLayout: boolean = false;
  let showAddRow: boolean = false;
  $: selectedRow = row.parentGrid.selected;

  $: selectedRow.subscribe((row) => {
    showChangeLayout = false;
    showAddRow = false;
  });

  const addRow = (index: number, template?: RowLayout) => {
    row.parentGrid.addRow(template, index);
    showAddRow = false;
    row.parentGrid.editor.selection.setCursorLocation();
  };

  const setRowLayout = (template: RowLayout) => {
    row.setLayout(template);
  };
</script>

<div
  class="wrapper"
  contenteditable="false"
  unselectable={true}
  draggable="false"
  bind:this={gridMenuWrapper}
  data-mce-bogus="all"
>
  {#if $selectedRow === row.id || $selectedRow === true}
    <div class="gridMenu" transition:fade={{ delay: 100, duration: 200 }}>
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
            showChangeLayout = !showChangeLayout;
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
            showAddRow = !showAddRow;
            showChangeLayout = false;
          }}
        >
          +
        </button>
      </div>
      {#if showAddRow}
        <div class="addRowSelect" transition:slide>
          <button
            title="Add Row Above"
            class="addAbove"
            on:click={() => addRow(row.index)}
            transition:fade
          >
            &#8593;
          </button>
          <button
            title="Add Row Below"
            class="addBelow"
            on:click={() => addRow(row.index + 1)}
            transition:fade
          >
            &#8595;
          </button>
        </div>
      {/if}
      {#if showChangeLayout}
        <div
          class="layoutConfig"
          contenteditable="false"
          unselectable={true}
          data-mce-bogus="all"
        >
          <GridLayouts
            on:add={(e) => {
              setRowLayout(e.detail);
              showChangeLayout = false;
            }}
          />
        </div>
      {/if}
    </div>
  {/if}
</div>

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
      & .change {
        transform: rotate(90deg);
        &:hover {
          transform: rotate(90deg) scale(1, 1.4);
        }
      }
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
    @apply bg-transparent text-white border-0 transition;
    & .active,
    &:hover {
      transform: scale(1.25);
    }
  }
</style>
