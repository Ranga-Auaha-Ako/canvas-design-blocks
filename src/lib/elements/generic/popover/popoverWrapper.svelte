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
  import { onDestroy } from "svelte";
  import type { SvelteComponent } from "svelte";
  import { writable, type Readable, type Writable } from "svelte/store";
  import type { McePopover } from "./popover";

  export let component: typeof SvelteComponent<any> | undefined = undefined;
  export let host: McePopover | undefined = undefined;
  export let show: boolean = false;
  export let props: Record<string, unknown> | undefined = undefined;
  export let placement: Placement = "top";
  export let target: HTMLElement | undefined = undefined;
  export let isDominant: Writable<boolean> | undefined = undefined;
  export let dominantPopover: Readable<boolean> | undefined = undefined;
  export let middleware:
    | {
        flip?: true | Parameters<typeof flip>[0];
        offset?: true | Parameters<typeof offset>[0];
        shift?: true | Parameters<typeof shift>[0];
        hide?: true | Parameters<typeof hide>[0];
      }
    | undefined = undefined;

  $: middlewareMap = Object.entries(
    middleware || { shift: { crossAxis: true } }
  ).map(([middleware, props]) => {
    switch (middleware) {
      case "flip":
        return props === true
          ? flip()
          : flip(props as Parameters<typeof flip>[0]);
      case "offset":
        return props === true
          ? offset()
          : offset(props as Parameters<typeof offset>[0]);
      case "shift":
        return props === true
          ? shift()
          : shift(props as Parameters<typeof shift>[0]);
      case "hide":
        return props === true
          ? hide()
          : hide(props as Parameters<typeof hide>[0]);
    }
  });

  let cleanup: () => void;
  export let popoverEl: HTMLElement | undefined = undefined;

  let x = 0;
  let y = 0;
  let isVisible = false;
  $: transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;

  $: updateFunction = async () => {
    if (!target || !popoverEl) {
      return;
    }
    if (
      show &&
      (!target || !popoverEl || !target.ownerDocument.contains(target))
    ) {
      host?.hide();
      return;
    }
    const position = await computePosition(target, popoverEl, {
      placement,
      middleware: middlewareMap,
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
      <svelte:component
        this={component}
        {props}
        {isDominant}
        {dominantPopover}
      />
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
    & > :global(*) {
      @apply pointer-events-auto;
    }
  }
</style>
