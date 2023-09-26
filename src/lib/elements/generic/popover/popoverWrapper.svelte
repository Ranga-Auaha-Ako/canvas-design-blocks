<svelte:options accessors={true} />

<script lang="ts">
  import {
    computePosition,
    autoUpdate,
    flip,
    offset,
    shift,
    hide,
    autoPlacement,
    arrow,
  } from "@floating-ui/dom";
  import type { Placement } from "@floating-ui/dom";
  import { onDestroy } from "svelte";
  import type { SvelteComponent } from "svelte";
  import { writable, type Readable, type Writable } from "svelte/store";
  import type { McePopover } from "./popover";
  import { fade } from "svelte/transition";

  export let component: typeof SvelteComponent<any> | undefined = undefined;
  export let host: McePopover | undefined = undefined;
  export let show: boolean = false;
  export let props: Record<string, unknown> | undefined = undefined;
  export let placement: Placement = "top";
  export let target: HTMLElement | undefined = undefined;
  export let isDominant: Writable<boolean> | undefined = undefined;
  export let dominantPopover: Readable<boolean> | undefined = undefined;
  export let showArrow: boolean = false;
  export let middleware:
    | {
        flip?: true | Parameters<typeof flip>[0];
        offset?: true | Parameters<typeof offset>[0];
        shift?: true | Parameters<typeof shift>[0];
        hide?: true | Parameters<typeof hide>[0];
        autoPlacement?: true | Parameters<typeof autoPlacement>[0];
      }
    | undefined = undefined;
  let isModal = false;
  export const focus = () => {
    if (popoverEl) {
      if (popoverEl.open) popoverEl.close();
      popoverEl.showModal();
      isModal = true;
    }
  };
  $: if (!show) popoverEl?.close();

  $: middlewareMap = Object.entries(
    middleware || { shift: { crossAxis: true } }
  )
    .map(([middleware, props]) => {
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
        case "autoPlacement":
          return props === true
            ? autoPlacement()
            : autoPlacement(props as Parameters<typeof autoPlacement>[0]);
      }
    })
    .concat(
      showArrow && arrowEl
        ? [
            arrow({
              element: arrowEl,
              padding: 5,
            }),
          ]
        : []
    );

  let cleanup: () => void;
  export let popoverEl: HTMLDialogElement | undefined = undefined;
  export let arrowEl: HTMLElement | undefined = undefined;

  let x = 0;
  let y = 0;
  let isVisible = false;
  $: transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
  let arrowX: number | undefined;
  let arrowY: number | undefined;
  let popupPlacement: Placement | undefined;
  let arrowTop: string | undefined;
  let arrowLeft: string | undefined;
  $: switch (popupPlacement) {
    case "top":
      arrowTop = "calc(100% - 1rem)";
      arrowLeft = arrowX ? `${Math.round(arrowX)}px` : "50%";
      break;
    case "bottom":
      arrowTop = "-0.5rem";
      arrowLeft = arrowX ? `${Math.round(arrowX)}px` : "50%";
      break;
    case "left":
      arrowLeft = "calc(100% - 1rem)";
      arrowTop = arrowY ? `${Math.round(arrowY)}px` : "50%";
      break;
    case "right":
      arrowLeft = "-0.5rem";
      arrowTop = arrowY ? `${Math.round(arrowY)}px` : "50%";
      break;
    default:
      arrowTop = arrowY ? `${Math.round(arrowY)}px` : "50%";
      arrowLeft = arrowX ? `${Math.round(arrowX)}px` : "50%";
  }

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
    if (middlewareData.arrow && arrowEl) {
      popupPlacement = position.placement;
      arrowX = middlewareData.arrow.x;
      arrowY = middlewareData.arrow.y;
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
  <dialog
    class="cgb-popover-wrapper"
    style:transform
    bind:this={popoverEl}
    open={component && show && target && popoverEl && isVisible}
    on:close={() => {
      host?.hide();
    }}
    tabindex="0"
  >
    {#if component && show}
      <svelte:component
        this={component}
        {props}
        {isDominant}
        {dominantPopover}
        {isModal}
      />
    {/if}
    {#if showArrow}
      <div
        class="popover--Arrow"
        bind:this={arrowEl}
        style:top={arrowTop}
        style:left={arrowLeft}
      />
    {/if}
  </dialog>
</div>

<style lang="postcss">
  .cgb-popover-wrapper {
    @apply absolute top-0 left-0 m-0 p-0 bg-transparent;
    @apply z-10 pointer-events-none;
    @apply invisible opacity-0 transition-opacity overflow-visible;
    &[open] {
      @apply visible opacity-100;
    }
    & > :global(*) {
      @apply pointer-events-auto;
    }
  }
  .popover--Arrow {
    @apply block absolute rounded w-4 h-4 rotate-45;
    @apply bg-primary shadow -z-10;
  }
</style>
