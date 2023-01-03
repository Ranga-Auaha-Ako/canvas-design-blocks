<script lang="ts">
  import { get, Readable, Writable } from "svelte/store";
  import Grid from "$lib/elements/grid/grid";
  import { RowLayout } from "$lib/elements/grid/rowLayouts";
  import GridLayouts from "$lib/elements/grid/popup/layoutEditor/gridLayouts.svelte";
  import { onMount } from "svelte";
  import preventBubble from "$lib/util/preventBubble";
  import { fade, fly, slide } from "svelte/transition";
  import Row from "$lib/elements/grid/row";
  import ArrowOpenDown from "$assets/icons/arrow-open-down.svelte";
  import ArrowOpenUp from "$assets/icons/arrow-open-up.svelte";
  import ConfigureIcon from "$assets/icons/configure.svelte";
  import AdvancedSettings from "./layoutEditor/advancedSettings.svelte";
  import Column from "../column";
  import ColSettings from "./layoutEditor/advancedSettings/colSettings.svelte";

  export let props: { col: Column };

  // Either false or the id of the row to change layout for
  let showConfig: boolean = false;
  let showAddRow: boolean = false;

  let gridMenuEl: HTMLElement;

  $: if (props.col.id) {
    showConfig = false;
    showAddRow = false;
  }
</script>

<div class="cgb-component" use:preventBubble>
  <div
    class="gridMenu"
    bind:this={gridMenuEl}
    transition:fade={{ delay: 100, duration: 200 }}
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
        <!-- &#8801; -->
        <ConfigureIcon />
      </button>
    </div>
  </div>
  {#if showConfig}
    <div class="layoutConfig" transition:fade>
      <ColSettings column={props.col} />
    </div>
  {/if}
</div>

<!-- svelte-ignore css-unused-selector -->
<style lang="postcss">
  .gridMenu {
    @apply px-2 py-0.5 h-6;
    @apply bg-uni-blue-light text-white rounded-full shadow;
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