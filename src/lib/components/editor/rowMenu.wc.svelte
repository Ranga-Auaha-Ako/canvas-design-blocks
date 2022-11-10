<svelte:options tag="cgb-rowmenu" />

<script lang="ts">
  import { get, Readable, Writable } from "svelte/store";
  import Grid from "$lib/grid/grid";
  import { RowLayout } from "$lib/grid/rowLayouts";
  import Portal from "$lib/portal/portal.svelte";
  import GridLayouts from "$lib/components/layoutEditor/gridLayouts.svelte";
  import { onMount } from "svelte";
  import preventBubble from "$lib/util/preventBubble";
  import { fade, slide } from "svelte/transition";
  import Row from "$lib/grid/row";
  import ArrowOpenDown from "$assets/icons/arrow-open-down.svelte";
  import ArrowOpenUp from "$assets/icons/arrow-open-up.svelte";
  import ConfigureIcon from "$assets/icons/configure.svelte";

  export let row: Row | undefined;

  // Either false or the id of the row to change layout for
  let showChangeLayout: boolean = false;
  let showAddRow: boolean = false;
  $: selectedRow = row?.parentGrid.selected;

  $: selectedRow?.subscribe((row) => {
    showChangeLayout = false;
    showAddRow = false;
  });

  // Track state of the row menu
  let showAdvancedOpen: Writable<boolean>;

  const addRow = (index: number, template?: RowLayout) => {
    row?.parentGrid.addRow(template, index);
    showAddRow = false;
    row?.parentGrid.editor.selection.setCursorLocation();
  };

  const setRowLayout = (template: RowLayout) => {
    row?.setLayout(template);
  };
</script>

{#if row !== undefined && ($selectedRow === row.id || $selectedRow === true)}
  <div class="gridMenu" transition:fade={{ delay: 100, duration: 200 }}>
    <div class="actions">
      <!-- Delete Row -->
      <button
        title="Delete Row"
        class="delete"
        on:click={() => {
          row?.delete();
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
        <!-- &#8801; -->
        <ConfigureIcon />
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
  </div>
  {#if showAddRow}
    <div class="addRowSelect" transition:slide>
      <button
        title="Add Row Above"
        class="addAbove"
        on:click={() => row && addRow(row.index, get(row.layout))}
        transition:fade
      >
        <ArrowOpenUp />
      </button>
      <button
        title="Add Row Below"
        class="addBelow"
        on:click={() => row && addRow(row.index + 1, get(row.layout))}
        transition:fade
      >
        <ArrowOpenDown />
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
        showAdvanced={true}
        bind:settingsOpen={showAdvancedOpen}
        {row}
        on:add={(e) => {
          setRowLayout(e.detail);
          if (!$showAdvancedOpen) {
            showChangeLayout = false;
          }
        }}
        on:cancel={() => {
          showChangeLayout = false;
        }}
      />
    </div>
  {/if}
{/if}

<style lang="postcss">
  @import "../../../app.postcss";
  .menu {
    @apply sticky top-2 px-2 py-0.5 h-6;
    @apply bg-uni-blue text-white rounded-full shadow;
  }
  .gridMenu {
    @apply mx-auto w-fit max-w-full menu pointer-events-auto;

    & .actions {
      @apply flex items-center h-full gap-2;
      & .change {
        /* transform: rotate(90deg); */
        &:hover {
          /* transform: rotate(90deg) scale(1, 1.4); */
        }
      }
    }
  }

  .addRowSelect {
    @apply menu;
    @apply flex items-center sticky gap-2 z-10 pointer-events-auto;
    @apply bg-uni-blue-light;
    @apply left-0 right-0 top-9 mt-0.5 mx-auto w-fit;
  }

  .layoutConfig {
    @apply sticky top-7 w-full pointer-events-auto;
    @apply bg-uni-blue text-white rounded-full shadow;
  }

  button {
    @apply bg-transparent text-white border-0 transition;
    @apply flex items-center justify-center;
    & .active,
    &:hover {
      transform: scale(1.25);
    }
  }
</style>
