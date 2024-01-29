<script lang="ts">
  import { RowLayout, rowTemplates } from "$lib/elements/grid/rowLayouts";
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { fade, slide } from "svelte/transition";
  const dispatch = createEventDispatcher();
  import { clickOutside } from "svelte-use-click-outside";
  import deriveWindow from "$lib/util/deriveWindow";
  import type Row from "$lib/elements/grid/row";
  import { persisted } from "svelte-persisted-store";
  import AdvancedSettings from "../advancedSettings/rowSettings.svelte";
  import { Readable } from "svelte/store";
  import {
    autoUpdate,
    computePosition,
    flip,
    offset,
    shift,
  } from "@floating-ui/dom";

  export let row: Row | false = false;
  export let showAdvanced = !!row;
  export let activeLayout: Readable<RowLayout> | undefined = row
    ? row.layout
    : undefined;

  export let settingsOpen = persisted("cgb-preferences-showadvanced", false);

  // Popover management
  export let sourceTarget: HTMLElement;
  let x = 0;
  let y = 0;
  let popoverEl: HTMLDivElement;
  $: transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
  let editorWidth = "50vw";
  $: editorBody = row ? row.editor.getBody() : undefined;

  $: updateFunction = async () => {
    let additionalOffset = [0, 0];
    const position = await computePosition(sourceTarget, popoverEl, {
      placement: showAdvanced && $settingsOpen ? "top" : "top",
      middleware: [offset(0), shift(), flip(), offset(10)],
    });
    x = position.x + additionalOffset[0];
    y = position.y + additionalOffset[1];
    editorWidth = editorBody ? `${editorBody.offsetWidth}px` : "50vw";
  };

  let cleanup: () => void;
  $: if (sourceTarget && popoverEl) {
    if (cleanup) cleanup();
    cleanup = autoUpdate(sourceTarget, popoverEl, updateFunction);
  }

  onDestroy(() => {
    if (cleanup) cleanup();
  });
</script>

<div class="cgb-component">
  <div
    class="layoutList"
    class:expanded={row && $settingsOpen}
    in:slide
    out:fade|global
    bind:this={popoverEl}
    style:transform
    style:--full-width={editorWidth}
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
          title="settings"
        >
          <span class="icon">
            <i
              class="icon-Line icon-TextSize icon-settings"
              aria-hidden="true"
            />
          </span>
          {$settingsOpen ? "Hide" : ""} Advanced Settings
        </button>
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  .layoutList {
    @apply absolute top-0 left-0;
    @apply mx-auto z-20 overflow-hidden cursor-auto box-content;
    @apply h-52 transition duration-300;
    @apply bg-secondary rounded-md shadow-lg border-solid border-secondary;
    @apply grid;
    transition-property: color, background-color, border-color, opacity,
      box-shadow, filter, backdrop-filter, width, height;
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
            @apply bg-secondary rounded;
            width: var(--gridViewColWidth);
          }
          &.active {
            @apply border-2 border-solid border-secondary;
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
          /* @apply py-1; */
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
      width: 0;
    }

    &.expanded {
      @apply bg-primary border-primary;
      --full-width: calc(var(--col-width) * 2 + var(--border-width));
      height: min(260px, calc(100vh - 3.5rem));
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
        width: calc(var(--full-width) - 10rem - var(--border-width));
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
