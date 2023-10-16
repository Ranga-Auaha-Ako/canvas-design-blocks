<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import GridManager from "$lib/elements/grid/gridManager";
  import preventBubble from "$lib/util/preventBubble";
  import IconWhite from "$assets/brand/Icon_White.svg?inline";
  import { slide } from "svelte/transition";
  const dispatch = createEventDispatcher();
  import { changes, version } from "$lib/util/constants";
  import Grid from "$lib/elements/grid/grid";
  import ElementPanel from "$lib/toolbar/elementPanel.svelte";
  import type { stateObject } from "src/main";
  import ElementManager from "$lib/elements/generic/elementManager";
  import gtag from "$lib/util/gtag";
  import { persisted } from "svelte-persisted-store";

  export let state: stateObject | undefined;
  export let managers: ElementManager[];

  const last_opened_ver = persisted("cdb_version_opened", "2.8.3");

  $: open = state?.showInterface;
  $: configComponent = state?.configComponent;

  let container: HTMLElement;
  $: if (container) preventBubble(container);

  let openedThisSession = false;

  const add = (manager: ElementManager) => {
    if (!managers) return;
    const newManager = manager.create(true, true);
    if (!openedThisSession) {
      gtag("event", `design_blocks_insert`, {
        event_category: "Design Blocks",
        event_label: manager.elementName,
      });
    }
    openedThisSession = true;
  };

  $: if ($open) {
    gtag("event", `design_blocks_open`, {
      event_category: "Design Blocks",
      cdb_version: version,
    });
  }
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
    {#if $last_opened_ver !== version}
      <div class="new-popup" out:slide>
        <h3>Design Blocks {version}</h3>
        <p>
          {changes ||
            "This new version of Design Blocks contains minor bug fixes and improvements."}
        </p>
        <button
          on:click={() => {
            $last_opened_ver = version;
          }}
        >
          <i class="icon icon-Solid icon-heart" />
          Got it!
        </button>
      </div>
    {/if}
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
    }
  }

  .advanced-settings {
    @apply p-2;
  }

  .new-popup {
    @apply relative p-2 my-2 bg-white text-black rounded border border-secondary;
    @apply flex flex-col gap-3;

    h3 {
      @apply text-sm font-bold leading-none m-0;
    }
    p {
      @apply text-xs m-0;
    }
    button {
      @apply text-xs bg-secondary text-white rounded-sm px-2 py-1;
      & i:before {
        @apply text-xs leading-none;
      }
    }
  }
</style>
