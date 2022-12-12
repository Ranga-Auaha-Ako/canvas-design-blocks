<script lang="ts">
  import { get, Readable, Writable } from "svelte/store";
  import Grid from "$lib/grid/grid";
  import { RowLayout } from "$lib/grid/rowLayouts";
  import Portal from "$lib/portal/portal.svelte";
  import GridLayouts from "$lib/grid/components/layoutEditor/gridLayouts.svelte";
  import { onMount } from "svelte";
  import preventBubble from "$lib/util/preventBubble";
  import { fade, slide } from "svelte/transition";
  import Row from "$lib/grid/row";
  import ArrowOpenDown from "$assets/icons/arrow-open-down.svelte";
  import ArrowOpenUp from "$assets/icons/arrow-open-up.svelte";
  import ConfigureIcon from "$assets/icons/configure.svelte";

  export let props: { row: Row };

  // Either false or the id of the row to change layout for
  let showChangeLayout: boolean = false;
  let showAddRow: boolean = false;

  $: if (props.row.id) {
    showChangeLayout = false;
    showAddRow = false;
  }

  // Track state of the row menu
  let showAdvancedOpen: Writable<boolean>;

  const addRow = (index: number, template?: RowLayout) => {
    props.row.parentGrid.addRow(template, index);
    showAddRow = false;
    props.row.parentGrid.editor.selection.setCursorLocation();
  };

  const setRowLayout = (template: RowLayout) => {
    props.row.setLayout(template);
  };
</script>

<div class="cgb-component" use:preventBubble>
  <div class="gridMenu" transition:fade={{ delay: 100, duration: 200 }}>
    <div class="actions">
      <!-- Delete Row -->
      <button
        title="Delete Row"
        class="delete"
        on:click={() => {
          props.row.delete();
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
        on:click={() => addRow(props.row.index, get(props.row.layout))}
        transition:fade
      >
        <ArrowOpenUp />
      </button>
      <button
        title="Add Row Below"
        class="addBelow"
        on:click={() => addRow(props.row.index + 1, get(props.row.layout))}
        transition:fade
      >
        <ArrowOpenDown />
      </button>
    </div>
  {/if}
  {#if showChangeLayout}
    <div class="layoutConfig">
      <GridLayouts
        showAdvanced={true}
        bind:settingsOpen={showAdvancedOpen}
        row={props.row}
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
</div>

<!-- svelte-ignore css-unused-selector -->
<style lang="postcss">
  .gridMenu {
    @apply sticky top-2 px-2 py-0.5 h-6;
    @apply bg-uni-blue text-white rounded-full shadow;
    @apply mx-auto w-fit;
    & .actions {
      @apply flex h-full items-stretch;
      & .change {
        /* transform: rotate(90deg); */
        &:hover {
          /* transform: rotate(90deg) scale(1, 1.4); */
        }
      }
    }
  }

  .addRowSelect {
    @apply flex items-center absolute z-10 px-2 py-0.5 h-6;
    @apply bg-uni-blue-light rounded-full shadow text-white;
    @apply left-0 right-0 mt-0.5 mx-auto w-fit;
  }

  button {
    @apply bg-transparent text-white border-0 transition;
    @apply flex items-center justify-center px-0.5;
    & .active,
    &:hover {
      transform: scale(1.25);
    }
    & :global(svg) {
      @apply w-3 h-3 fill-current;
    }
  }
</style>
