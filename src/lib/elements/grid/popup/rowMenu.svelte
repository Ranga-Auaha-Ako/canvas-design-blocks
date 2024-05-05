<script lang="ts">
  import { get, Readable, Writable } from "svelte/store";
  import { RowLayout } from "$lib/elements/grid/rowLayouts";
  import GridLayouts from "$lib/elements/grid/popup/layoutEditor/gridLayouts.svelte";
  import preventBubble from "$lib/util/preventBubble";
  import { fade, slide } from "svelte/transition";
  import Row from "$lib/elements/grid/row";
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { IconType } from "$lib/icons/svelte/iconPicker";

  export let props: { row: Row };
  export let isDominant: Writable<boolean>;
  export let dominantPopover: Readable<boolean> | undefined = undefined;

  // Either false or the id of the row to change layout for
  let showChangeLayout: boolean = false;
  let showAddRow: boolean = false;
  let showPasteRow: boolean = false;
  $: canPaste = props.row.canPaste;

  $: if (showChangeLayout) {
    isDominant.set(true);
  } else {
    isDominant.set(false);
  }

  $: if (!$dominantPopover) {
    showChangeLayout = false;
    showAddRow = false;
  }

  let gridMenuEl: HTMLElement;

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
  <div
    class="gridMenu"
    class:showChangeLayout
    bind:this={gridMenuEl}
    transition:fade|global={{ delay: 100, duration: 200 }}
  >
    <div class="actions">
      <!-- Delete Row -->
      <button
        title="Delete Row"
        class="delete"
        on:click={() => {
          props.row.delete();
        }}
      >
        <span class="icon">
          <IconElement
            icon={{ id: "Inst.Line.trash", type: IconType.Custom }}
          />
        </span>
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
        <span class="icon">
          <i
            class="icon-Line icon-TextSize icon-configure"
            aria-hidden="true"
          />
        </span>
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
        <span class="icon">
          <i class="icon-Solid icon-TextSize icon-add" aria-hidden="true" />
        </span>
      </button>
      <!-- Copy row -->
      <button
        title="Copy Row"
        class="copy"
        on:click={() => {
          props.row.copy();
        }}
      >
        <span class="icon">
          <i class="icon-line icon-TextSize icon-copy" aria-hidden="true" />
        </span>
      </button>

      {#if $canPaste}
        <!-- Paste row -->
        <button
          title="Paste Row"
          class="paste"
          on:click={() => {
            showPasteRow = !showPasteRow;
          }}
        >
          <span class="icon icon-paste">
            <i class="icon-Solid icon-TextSize icon-copy" aria-hidden="true" />
          </span>
        </button>
      {/if}
    </div>
  </div>
  {#if showAddRow}
    <div class="addRowSelect" transition:slide|global>
      <button
        title="Add Row Above"
        class="addAbove"
        on:click={() => addRow(props.row.index, get(props.row.layout))}
        transition:fade|global
      >
        <IconElement
          icon={{
            id: "Inst.Line.table-insert-row-above",
            type: IconType.Custom,
          }}
        />
      </button>
      <button
        title="Add Row Below"
        class="addBelow"
        on:click={() => addRow(props.row.index + 1, get(props.row.layout))}
        transition:fade|global
      >
        <IconElement
          icon={{
            id: "Inst.Line.table-insert-row-after",
            type: IconType.Custom,
          }}
        />
      </button>
    </div>
  {/if}
  {#if showPasteRow}
    <div class="addRowSelect" transition:slide|global>
      <button
        title="Paste Row Above"
        class="addAbove"
        on:click={() => props.row.paste("beforebegin")}
        transition:fade|global
      >
        <IconElement
          icon={{
            id: "Inst.Line.table-insert-row-above",
            type: IconType.Custom,
          }}
        />
      </button>
      <button
        title="Paste Row Below"
        class="addBelow"
        on:click={() => props.row.paste("afterend")}
        transition:fade|global
      >
        <IconElement
          icon={{
            id: "Inst.Line.table-insert-row-after",
            type: IconType.Custom,
          }}
        />
      </button>
      <button
        title="Replace Row"
        class="addBelow"
        on:click={() => props.row.paste("replace")}
        transition:fade|global
      >
        <IconElement
          icon={{
            id: "Inst.Line.table-row-properties",
            type: IconType.Custom,
          }}
        />
      </button>
    </div>
  {/if}
  {#if showChangeLayout}
    <div class="layoutConfig">
      <GridLayouts
        showAdvanced={true}
        bind:settingsOpen={showAdvancedOpen}
        row={props.row}
        sourceTarget={gridMenuEl}
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
    @apply px-2 py-0.5 h-6;
    @apply bg-primary text-white rounded-full shadow select-none;
    @apply mx-auto w-fit;
    @apply transition-shadow duration-300;
    &.showChangeLayout {
      @apply ring-4 ring-primary ring-opacity-50;
    }
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
    @apply bg-secondary rounded-full shadow text-white;
    @apply left-0 right-0 mt-0.5 mx-auto w-fit;
  }

  button {
    @apply bg-transparent text-white border-0 transition;
    @apply flex items-center justify-center px-1;
    & .active,
    &:hover {
      transform: scale(1.25);
    }
    & :global(svg) {
      @apply w-3 h-3 fill-current;
    }
  }

  .icon-paste {
    @apply relative;
    :after {
      @apply block;
      @apply rounded-full bg-primary ring-1 ring-white text-white font-bold;
      @apply absolute bottom-0.5 -right-0.5;
      content: "+";
      --paste-icon-size: 0.5rem;
      line-height: var(--paste-icon-size);
      font-size: calc(var(--paste-icon-size) + 0.1rem);
      height: var(--paste-icon-size);
      width: var(--paste-icon-size);
    }
  }
</style>
