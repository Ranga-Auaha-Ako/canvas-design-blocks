<script lang="ts">
  import { get, Readable, Writable } from "svelte/store";
  import Grid from "$lib/elements/grid/grid";
  import { RowLayout } from "$lib/elements/grid/rowLayouts";
  import GridLayouts from "$lib/elements/grid/popup/layoutEditor/gridLayouts.svelte";
  import { onMount } from "svelte";
  import preventBubble from "$lib/util/preventBubble";
  import { fade, fly, slide } from "svelte/transition";
  import Row from "$lib/elements/grid/row";
  import AdvancedSettings from "./advancedSettings/rowSettings.svelte";
  import Column from "../column";
  import ColSettings from "./advancedSettings/colSettings.svelte";
  import type { McePopover } from "$lib/elements/generic/popover/popover";

  export let props: { col: Column };
  export let isDominant: Writable<boolean>;
  export let dominantPopover: Readable<boolean> | undefined = undefined;

  // Either false or the id of the row to change layout for
  let showConfig: boolean = false;
  let showAddRow: boolean = false;

  $: if (showConfig) {
    isDominant.set(true);
  } else {
    isDominant.set(false);
  }

  $: if (!$dominantPopover) {
    showConfig = false;
    showAddRow = false;
  }

  let gridMenuEl: HTMLElement;

  $: if (props.col.id) {
    showConfig = false;
    showAddRow = false;
  }
</script>

<div class="cgb-component" use:preventBubble>
  <div
    class="gridMenu"
    class:showConfig
    bind:this={gridMenuEl}
    transition:fade|global={{ delay: 100, duration: 200 }}
  >
    <div class="actions">
      <!-- Change Layout -->
      <button
        title="Change Layout"
        class="change"
        on:click={() => {
          showConfig = !showConfig;
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
    </div>
  </div>
  {#if showConfig}
    <div class="layoutConfig" transition:fade|global>
      <ColSettings column={props.col} />
    </div>
  {/if}
</div>

<!-- svelte-ignore css-unused-selector -->
<style lang="postcss">
  .gridMenu {
    @apply px-2 py-0.5 h-6;
    @apply bg-secondary text-white rounded-full shadow select-none;
    @apply mx-auto w-fit;
    @apply transition-shadow duration-300;
    &.showConfig {
      @apply ring-4 ring-secondary ring-opacity-50;
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

  .layoutConfig {
    @apply z-20 relative;
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
</style>
