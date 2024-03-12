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
  import Portal from "$lib/portal/portal.svelte";
  import { onMount } from "svelte";
  import PopoverWrapper from "$lib/elements/generic/popover/popoverWrapper.svelte";
  import { fly } from "svelte/transition";

  export let target: HTMLElement;
  let panel: HTMLDivElement;
</script>

<Portal>
  <PopoverWrapper
    {target}
    show={true}
    placement={"right-start"}
    showArrow={true}
    middleware={{
      offset: {
        mainAxis: 10,
        crossAxis: -10,
      },
      shift: {
        mainAxis: true,
      },
    }}
  >
    <div
      class="tooltip"
      role="tooltip"
      in:fly|global={{ x: -10, duration: 200 }}
      out:fly|global={{ x: -10, duration: 200, delay: 300 }}
      on:mouseenter
      on:mouseleave
    >
      <slot />
    </div>
  </PopoverWrapper>
</Portal>

<style lang="postcss">
  .tooltip {
    @apply w-max max-w-prose;
    @apply rounded shadow bg-white border border-gray-200;
  }
</style>
