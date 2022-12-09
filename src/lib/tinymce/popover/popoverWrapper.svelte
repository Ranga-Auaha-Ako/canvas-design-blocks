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
  import type { SvelteComponent } from "svelte";
  import { fade } from "svelte/transition";

  export let component: typeof SvelteComponent | undefined = undefined;
  export let show: boolean = false;
  export let props: Record<string, unknown> | undefined = undefined;
  export let target: HTMLElement | undefined = undefined;

  let cleanup: () => void;
  export let popoverEl: HTMLElement;

  let x = 0;
  let y = 0;
  $: transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;

  $: updateFunction = async () => {
    if (!target || !popoverEl) return;
    let additionalOffset = [0, 0];
    if (target.ownerDocument !== popoverEl.ownerDocument) {
      const iframe = target.ownerDocument.defaultView?.frameElement;
      if (iframe) {
        const { left, top } = iframe.getBoundingClientRect();
        additionalOffset = [left, top];
      }
    }
    const position = await computePosition(target, popoverEl, {
      placement: "top",
      middleware: [offset(0), flip(), shift(), hide({ strategy: "escaped" })],
    });
    x = position.x + additionalOffset[0];
    y = position.y + additionalOffset[1];
  };

  $: if (component && show && target && popoverEl) {
    cleanup = autoUpdate(target, popoverEl, updateFunction);
  } else {
    if (cleanup) cleanup();
  }
  $: if (true) {
    console.log({ component, show, target, popover: popoverEl });
    // debugger;
  }
</script>

<div
  class="cgb-popover-wrapper"
  style:transform
  bind:this={popoverEl}
  class:active={component && show && target && popoverEl}
>
  {#if component && show}
    <svelte:component this={component} {props} />
  {/if}
</div>

<style lang="postcss">
  .cgb-popover-wrapper {
    @apply absolute top-0 left-0;
    @apply z-10 pointer-events-none;
    @apply invisible opacity-0 transition-all;
    &.active {
      @apply visible opacity-100;
    }
    &:global(> *) {
      @apply pointer-events-auto;
    }
  }
</style>
