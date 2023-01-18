<svelte:options accessors={true} />

<script lang="ts">
  import {
    computePosition,
    autoUpdate,
    flip,
    offset,
    shift,
    hide,
  } from "@floating-ui/dom";
  import type { Placement } from "@floating-ui/dom";
  import { onDestroy, SvelteComponent } from "svelte";
  import { fade } from "svelte/transition";

  export let component: typeof SvelteComponent | undefined = undefined;
  export let show: boolean = false;
  export let props: Record<string, unknown> | undefined = undefined;
  export let placement: Placement = "top";
  export let target: HTMLElement | undefined = undefined;

  let cleanup: () => void;
  export let popoverEl: HTMLElement;

  let x = 0;
  let y = 0;
  let isVisible = false;
  $: transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;

  $: updateFunction = async () => {
    if (!target || !popoverEl) return;
    const position = await computePosition(target, popoverEl, {
      placement,
      middleware: [
        shift(),
        // hide({
        //   strategy: "escaped",
        // }),
      ],
    });
    const { middlewareData } = position;
    isVisible = !middlewareData.hide?.escaped ?? false;
    if (isVisible) {
      x = position.x;
      y = position.y;
    }
  };

  $: if (component && show && target && popoverEl) {
    cleanup = autoUpdate(target, popoverEl, updateFunction);
  } else {
    if (cleanup) cleanup();
  }

  onDestroy(() => {
    if (cleanup) cleanup();
  });
</script>

<div class="cgb-component">
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div
    class="cgb-popover-wrapper"
    style:transform
    bind:this={popoverEl}
    class:active={component && show && target && popoverEl && isVisible}
    tabindex="0"
  >
    {#if component && show}
      <svelte:component this={component} {props} />
    {/if}
  </div>
</div>

<style lang="postcss">
  .cgb-popover-wrapper {
    @apply absolute top-0 left-0;
    @apply z-10 pointer-events-none;
    @apply invisible opacity-0 transition-opacity;
    &.active {
      @apply visible opacity-100;
    }
    &:global(> *) {
      @apply pointer-events-auto;
    }
  }
</style>
