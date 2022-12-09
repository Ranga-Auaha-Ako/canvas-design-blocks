<script lang="ts">
  import { RowLayout, rowTemplates } from "$lib/grid/rowLayouts";
  import { createEventDispatcher, onMount } from "svelte";
  import { fade, slide } from "svelte/transition";
  const dispatch = createEventDispatcher();
  import { clickOutside } from "svelte-use-click-outside";
  import deriveWindow from "$lib/util/deriveWindow";
  import Settings from "$assets/icons/settings.svelte";
  import type Row from "$lib/grid/row";
  import { writable } from "svelte-local-storage-store";
  import AdvancedSettings from "./advancedSettings.svelte";
  import { Readable } from "svelte/store";

  export let row: Row | false = false;
  export let showAdvanced = !!row;
  export let activeLayout: Readable<RowLayout> | undefined = row
    ? row.layout
    : undefined;

  export let settingsOpen = writable("cgb-preferences-showadvanced", false);

  // Source: https://stackoverflow.com/a/63424528/3902950
  const smartSlide = (node: Element) => {
    const { top, left, bottom, right } = node.getBoundingClientRect();
    const hostWindow = deriveWindow(node);
    if (
      hostWindow &&
      (node instanceof hostWindow.HTMLElement || node instanceof HTMLElement)
    ) {
      const toBottom = hostWindow.innerHeight - bottom;
      const toRight = hostWindow.innerWidth - right;

      if (toBottom < 0) {
        node.style.top = `${toBottom}px`;
      }
      if (toRight < 0) {
        node.style.left = `${toRight}px`;
      }
    }
    return slide(node);
  };
</script>

<div
  class="layoutList"
  class:expanded={row && $settingsOpen}
  in:smartSlide|local
  out:fade
>
  <div class="details">
    <div class="layoutOptions">
      <div class="layoutGrid">
        {#each Object.entries(rowTemplates) as [name, template] (template.id)}
          <button
            class="layout"
            class:active={$activeLayout && $activeLayout.id === template.id}
            title={name}
            tabindex="0"
            on:click={(e) => dispatch("add", template)}
          >
            {#each template.cols as col}
              <div
                class="col"
                style={`--gridViewColWidth:${(col.lg / 12) * 100}%;`}
              />
            {/each}
          </button>
        {/each}
      </div>
    </div>

    {#if showAdvanced}
      <div class="settings">
        {#if row && $settingsOpen}
          <AdvancedSettings {row} />
        {/if}
      </div>
    {/if}
  </div>
  {#if showAdvanced}
    <div class="advanced">
      <button
        class="open-advanced"
        on:click={() => ($settingsOpen = !$settingsOpen)}
      >
        <Settings />
        {$settingsOpen ? "Hide" : ""} Advanced Settings
      </button>
    </div>
  {/if}
</div>

<style lang="postcss">
  .layoutList {
    @apply mx-auto z-20 overflow-hidden cursor-auto box-content absolute left-1/2;
    @apply h-52 transition-all duration-300;
    @apply bg-uni-blue-light rounded-md shadow-lg border-solid border-uni-blue-light;
    @apply grid;
    transform: translateX(-50%);
    --col-width: 18rem;
    --full-width: var(--col-width);
    --border-width: 2px;
    border-width: var(--border-width);
    grid-template-areas:
      "settings"
      "advanced";
    grid-template-rows: 1fr auto;
    width: var(--col-width);
    & .details {
      grid-area: settings;
      @apply flex w-full overflow-y-auto;
    }
    & .layoutOptions {
      @apply z-20 p-2 bg-white rounded max-w-full overflow-y-auto box-border;
      grid-area: grid;
      width: var(--col-width);

      & .layoutGrid {
        @apply grid grid-cols-3 gap-1.5 items-stretch  w-full;
        min-height: 10rem;
        & .layout {
          @apply relative;
          @apply bg-slate-100 p-1.5 rounded border-0;
          @apply flex gap-1.5;
          @apply cursor-pointer transition;
          @apply h-8;
          &:hover {
            @apply bg-slate-200;
            transform: scale(1.05);
          }
          & .col {
            @apply h-full;
            @apply bg-uni-blue-light rounded;
            width: var(--gridViewColWidth);
          }
          &.active {
            @apply border-2 border-solid border-uni-blue-light;
            & .col {
            }
          }
        }
      }
    }
    & .advanced {
      @apply flex;
      grid-area: advanced;
      & button {
        @apply bg-transparent text-white font-bold border-0 text-xs text-center w-full p-0.5 transition;
        transition-property: padding, transform;

        &:hover {
          @apply py-2;
          transform: scale(1.05);
        }
        & :global(svg) {
          @apply inline-block relative fill-current;
          top: 0.15em;
          width: 1em;
          height: 1em;
        }
      }
    }
    & .settings {
      grid-area: settings;
      margin-left: -100%;
      @apply bg-white text-black rounded text-sm h-full overflow-y-auto;
      @apply p-0 relative transition-all z-10 invisible opacity-0 box-border;
      width: calc(var(--full-width) - 10rem - var(--border-width));
    }

    &.expanded {
      @apply bg-uni-blue border-uni-blue;
      --full-width: calc(var(--col-width) * 2 + var(--border-width));
      height: min(400px, calc(100vh - 3.5rem));
      width: var(--full-width);
      & .layoutOptions {
        width: 10rem;
        & .layoutGrid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      & .settings {
        @apply p-2 visible opacity-100;
        margin-left: var(--border-width);
      }
    }
  }

  @media (max-width: 640px) {
    .layoutList {
      --col-width: 90vw;
      --full-width: 90vw;
      border-width: var(--border-width);
      &.expanded {
        --full-width: 90vw;
        & .layoutOptions {
          @apply hidden;
          width: var(--col-width);
        }
        & .settings {
          margin-left: 0;
          width: var(--col-width);
        }
      }
    }
  }
</style>
