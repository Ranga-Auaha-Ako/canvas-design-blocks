<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import GridManager from "$lib/elements/grid/gridManager";
  import preventBubble from "$lib/util/preventBubble";
  import IconWhite from "$assets/brand/Icon_White.svg?inline";
  import { slide } from "svelte/transition";
  const dispatch = createEventDispatcher();
  import { version } from "$lib/util/constants";
  import Grid from "$lib/elements/grid/grid";
  import ElementPanel from "$lib/toolbar/elementPanel.svelte";
  import type { stateObject } from "src/main";
  import ElementManager from "$lib/elements/generic/elementManager";

  export let state: stateObject | undefined;
  export let managers: ElementManager[];

  $: open = state?.showInterface;
  $: configComponent = state?.configComponent;

  let container: HTMLElement;
  $: if (container) preventBubble(container);

  const add = (manager: ElementManager) => {
    if (!managers) return;
    const newManager = manager.create(true, true);
  };
</script>

<div bind:this={container} class="cgb-toolbar cgb-component">
  <button
    class="cgb-openButton"
    title="Canvas Design Blocks"
    class:cgb-active={$open}
    on:click={() => {
      $open = !$open;
      dispatch("open");
    }}
  >
    <div class="details">Design Blocks</div>
    <img src={IconWhite} alt="" />
  </button>

  {#if $open}
    {#if $configComponent}
      <div class="toolbar-menu advanced-settings" transition:slide|global>
        <svelte:component
          this={$configComponent.component}
          props={$configComponent.props}
        />
      </div>
    {/if}
    <div class="toolbar-menu" transition:slide|global>
      {#each managers as manager}
        <ElementPanel
          on:add={() => {
            add(manager);
          }}
        >
          <svelte:fragment slot="name"
            >Add {manager.elementName}</svelte:fragment
          >
        </ElementPanel>
      {/each}
      <div class="info-panel">
        <a
          href={import.meta.env.CANVAS_BLOCKS_THEME_CONTACT_LINK}
          target="_blank"
        >
          <span class="text-primary">Feedback</span>
        </a>
        <span class="version">
          v{version}
        </span>
      </div>
    </div>
  {/if}
</div>

<style lang="postcss">
  .cgb-toolbar {
    display: contents;
  }
  .cgb-openButton {
    @apply w-full h-8 py-1 px-2;
    @apply flex flex-row items-center;
    @apply transition text-sm border border-gray-200 rounded;
    &.cgb-active {
      @apply bg-primary text-white border-2 border-primary;
      /* Match Canvas border radius setting */
      border-radius: 3px;
    }
    & img {
      @apply h-full p-0.5;
    }
    & .details {
      @apply flex-grow text-left;
    }
  }

  .toolbar-menu {
    @apply border-gray-200 border rounded mt-2 overflow-clip;
    & .info-panel {
      @apply text-xs p-2 flex;
      & .version {
        @apply text-right flex-grow;
      }
      & i {
        @apply text-xs;
      }
    }
  }

  .advanced-settings {
    @apply p-2;
  }
</style>
