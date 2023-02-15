<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import GridManager from "$lib/elements/grid/gridManager";
  import preventBubble from "$lib/util/preventBubble";
  import IconWhite from "$assets/brand/Icon_White.svg";
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
    <div class="upgrade-warning" transition:slide>
      Warning! This version is no longer maintained. Please upgrade to the Google Chrome extension to continue using Design Blocks.
      <a target="_blank" rel="noreferrer" href="https://chrome.google.com/webstore/detail/pigilebjadbgcmklbgndfpckcgibedla">
      Upgrade</a>
      <i>Firefox and other versions coming soon.</i>
    </div>
    {#if $configComponent}
      <div class="toolbar-menu advanced-settings" transition:slide>
        <svelte:component
          this={$configComponent.component}
          props={$configComponent.props}
        />
      </div>
    {/if}
    <div class="toolbar-menu" transition:slide>
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
      <div class="version">
        <div class="version-num">
          v{version}<i>b</i>
        </div>
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
    @apply transition text-sm border border-uni-gray-200 rounded;
    &.cgb-active {
      @apply bg-uni-blue text-white border-2 border-uni-blue;
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
    @apply border-uni-gray-200 border rounded mt-2;
    & .version {
      @apply text-xs p-2;
      & .version-num {
        @apply text-xs text-right p-2;
        & i {
          @apply text-xs;
        }
      }
    }
  }
  .upgrade-warning {
    @apply mt-2 text-xs font-bold bg-orange-700 text-white rounded shadow p-2;
    & a {
      @apply text-black text-center bg-white rounded shadow block p-2 m-1 transition hover:opacity-80;
    }
  }

  .advanced-settings {
    @apply p-2;
  }
</style>
