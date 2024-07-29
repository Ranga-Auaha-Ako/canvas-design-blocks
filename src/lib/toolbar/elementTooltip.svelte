<script lang="ts">
  import Portal from "$lib/portal/portal.svelte";
  import {
    arrow,
    autoUpdate,
    computePosition,
    inline,
    offset,
    shift,
  } from "@floating-ui/dom";

  export let open = false;
  export let target: HTMLElement;
  let tooltipEl: HTMLElement;
  let arrowEl: HTMLElement;

  export let description: string;
  export let video: string | undefined = undefined;

  let x = 0;
  let y = 0;
  $: transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
  let arrowX: number | null | undefined;
  let arrowY: number | null | undefined;
  $: updateFunction = async () => {
    if (!target || !tooltipEl) return;
    const position = await computePosition(target, tooltipEl, {
      placement: "right-start",
      middleware: [
        offset(10),
        shift({
          padding: 10,
        }),
        inline(),
        arrow({
          element: arrowEl,
          padding: 5,
        }),
      ],
    });
    arrowX = position.middlewareData.arrow?.x;
    arrowY = position.middlewareData.arrow?.y;
    x = position.x;
    y = position.y;
  };
  let cleanup: () => void | undefined;
  $: if (open && tooltipEl && target) {
    if (cleanup) cleanup();
    cleanup = autoUpdate(target, tooltipEl, updateFunction);
  }
  $: if (!open && cleanup) cleanup();

  export let forceOpen = false;
  let nextAction: number | undefined;
  export const hideTooltip = () => {
    if (forceOpen) return;
    clearTimeout(nextAction);
    nextAction = window.setTimeout(() => {
      nextAction = undefined;
      open = false;
    }, 150);
  };

  export const showTooltip = () => {
    if (forceOpen) return;
    clearTimeout(nextAction);
    nextAction = window.setTimeout(() => {
      window.activeCDBElementTooltip?.();
      nextAction = undefined;
      open = true;
    }, 500);
  };

  $: if (open)
    window.activeCDBElementTooltip = () => {
      if (forceOpen) return;
      open = false;
      forceOpen = false;
    };
</script>

<Portal>
  <div bind:this={tooltipEl} class:open class="tooltip" style:transform>
    <div
      class="tooltip-arrow"
      style:top={arrowY != null ? `${arrowY}px` : undefined}
      style:left={arrowX != null ? `${arrowX}px` : undefined}
      bind:this={arrowEl}
    ></div>
    {#if open}
      <div class="contents">
        {#if video}
          <video src={video} autoplay muted></video>
        {/if}
        <div class="body">
          <p>
            {@html description}
          </p>
        </div>
        <div class="footer">
          <p>Click to add to page</p>
        </div>
      </div>
    {/if}
  </div></Portal
>

<style lang="postcss">
  .tooltip {
    @apply invisible opacity-0 transition-opacity duration-300;
    @apply absolute z-30 top-0 left-0;
    @apply text-sm bg-white text-black shadow-lg rounded-md;
    @apply border border-solid border-gray-300;
    transition-property: opacity, visibility;
    max-width: fit-content;
    width: min(calc(100% - 3rem), 65ch);
    &.open {
      @apply visible opacity-100 duration-500;
    }
    .tooltip-arrow {
      @apply absolute w-2 h-2 -left-1 -z-10 pointer-events-none;
      @apply bg-gray-300 rotate-45 rounded-tl-sm;
      &:after {
        @apply absolute w-full h-full top-0 left-0 bg-white;
        content: " ";
        /* Because we are at a 45deg angle, the offset for a 1px real-world border uses the right angle triangle hypotenuse calculation */
        transform: translate(0.7px, -0.7px);
      }
    }
  }

  .contents {
    @apply overflow-hidden rounded-md;
    @apply max-w-60;
    video {
      @apply max-w-full m-0 mt-4;
    }
    .body {
      @apply mx-4;
    }
    p {
      @apply text-justify text-sm mt-0 mb-3;
    }
    .footer {
      @apply px-3 py-2 border-0 border-t border-solid border-gray-300 bg-gray-100 select-none cursor-default;
      p {
        @apply m-0 text-center italic text-base text-gray-400;
      }
    }
  }
  @media (prefers-reduced-motion) {
    video {
      @apply hidden;
    }
  }
</style>
