<script lang="ts">
  import { ComponentType, createEventDispatcher, onMount } from "svelte";
  import GridManager from "$lib/elements/grid/gridManager";
  import preventBubble from "$lib/util/preventBubble";
  import IconWhite from "$assets/brand/Icon_White.svg?inline";
  import { fade, slide } from "svelte/transition";
  const dispatch = createEventDispatcher();
  import { changes, changeversion, version } from "$lib/util/constants";
  import Grid from "$lib/elements/grid/grid";
  import ElementPanel from "$lib/toolbar/elementPanel.svelte";
  import type { stateObject } from "src/desktop";
  import ElementManager from "$lib/elements/generic/elementManager";
  import gtag from "$lib/util/gtag";
  import { persisted } from "svelte-persisted-store";
  import { compareVersions } from "compare-versions";
  import { type Readable } from "svelte/store";

  export let state: stateObject | undefined;
  export let managers: Readable<ElementManager[]>;

  export let additionalItems: ComponentType[] = [];

  const last_opened_ver = persisted("cdb_version_opened", "2.8.3");

  $: open = state?.showInterface;
  $: configComponent = state?.configComponent;

  let container: HTMLElement;
  $: if (container) preventBubble(container);

  let openedThisSession = false;

  const add = (manager: ElementManager) => {
    if (!$managers) return;
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
  $: hasUpdate =
    !changeversion || compareVersions($last_opened_ver, changeversion) < 0;
</script>

<svelte:body class:cdb-toolbar-open={$open} />

<div bind:this={container} class="cgb-toolbar cgb-component">
  <button
    class="cgb-openButton"
    title="Canvas Design Blocks"
    class:cgb-active={$open}
    class:has-update={hasUpdate}
    on:click={() => {
      $open = !$open;
      dispatch("open");
    }}
  >
    <div class="details">Design Blocks</div>
    <img src={IconWhite} alt="" />
    {#if hasUpdate}
      <div class="update-ping" title="Update available!" out:fade></div>
    {/if}
  </button>

  {#if $open}
    {#if hasUpdate}
      <div class="new-popup" transition:slide|global>
        <h3>Design Blocks {version}</h3>
        <p>
          {changes ||
            "This new version of Design Blocks contains minor bug fixes and improvements."}
        </p>
        <button
          on:click={() => {
            $last_opened_ver = changeversion || version;
            gtag("event", `design_blocks_update_dismiss`, {
              event_category: "Design Blocks",
              cdb_version: version,
            });
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
      {#each $managers as manager}
        <ElementPanel
          on:add={() => {
            add(manager);
          }}
          name={manager.elementName}
        >
          <svelte:fragment slot="name">
            {#if manager.icon}
              <span class="cdb--icon toolbar-icon">{manager.icon}</span>
            {/if}
            {manager.elementName}
          </svelte:fragment>
        </ElementPanel>
      {/each}
      {#each additionalItems as item}
        <svelte:component this={item} />
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
    @apply relative w-full h-8 py-1 px-2;
    @apply flex flex-row items-center;
    @apply transition-all text-sm border border-gray-200 rounded;
    .update-ping {
      @apply absolute -top-1 -right-1 z-40;
      @apply w-2 h-2 bg-primary ring-1 ring-white ring-opacity-55 rounded-full;
      &:before {
        @apply absolute inset-0 w-full h-full bg-primary rounded-full;
        @apply animate-ping;
        animation-duration: 2s;
        content: " ";
      }
    }
    &.cgb-active {
      @apply bg-primary text-white border-2 border-primary;
      /* Match Canvas border radius setting */
      border-radius: 3px;
      .update-ping {
        @apply ring-primary bg-white;
        &:before {
          @apply bg-white;
        }
      }
    }
    &.has-update {
      @apply text-xs transition;
      max-width: calc(100% - 0.2rem);
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
  .toolbar-icon {
    margin-right: 0.2rem;
    font-size: 0.9rem;
    line-height: 1.15em;
    vertical-align: text-bottom;
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
