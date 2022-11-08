<script lang="ts">
  import { rowTemplates } from "$lib/grid/rowLayouts";
  import { createEventDispatcher, onMount } from "svelte";
  import { fade, slide } from "svelte/transition";
  const dispatch = createEventDispatcher();
  import { clickOutside } from "svelte-use-click-outside";
  import deriveWindow from "$lib/util/deriveWindow";
  import Settings from "$assets/icons/settings.svelte";

  export let showAdvanced = false;

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
  in:smartSlide|local
  out:fade
  use:clickOutside={() => dispatch("cancel")}
>
  <div class="layoutGrid">
    {#each Object.entries(rowTemplates) as [name, template]}
      <button
        class="layout"
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
  {#if showAdvanced}
    <div class="advanced">
      <button class="open-advanced" on:click={(e) => dispatch("openAdvanced")}>
        <Settings />
        Advanced Settings
      </button>
    </div>
  {/if}
</div>

<style lang="postcss">
  .layoutList {
    @apply absolute top-0 w-full max-w-sm z-20;
    @apply bg-uni-blue-light rounded-md shadow-lg border-2 border-solid border-uni-blue-light;
    & .layoutGrid {
      @apply grid grid-cols-3 gap-2 p-2 bg-white rounded;
      & .layout {
        @apply relative;
        @apply bg-slate-100 p-2 rounded border-0;
        @apply flex gap-2;
        @apply cursor-pointer transition;
        &:hover {
          @apply bg-slate-200;
          transform: scale(1.05);
        }
        & .col {
          @apply h-5;
          @apply bg-uni-blue-light rounded;
          width: var(--gridViewColWidth);
        }
      }
    }
    & .advanced {
      @apply flex;
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
  }
</style>
