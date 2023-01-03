<script lang="ts">
  import Row from "$lib/elements/grid/row";
  import type { Writable } from "svelte/store";
  import type { Colord } from "colord";
  import ColourPicker, {
    getColour,
  } from "$lib/util/components/colourPicker.svelte";
  import { slide } from "svelte/transition";
  import MceElement from "$lib/tinymce/mceElement";
  import type { Placement } from "@floating-ui/dom";

  export let element: MceElement;
  export let preferences: Writable<{
    background: Colord | undefined;
    textColor: Colord | undefined;
  }>;
  export let popupDirection: Placement = "bottom-start";

  $: contrastLevel = (
    inferredTextCol && $preferences.background
      ? inferredTextCol.contrast($preferences.background)
      : false
  ) as false | number;
  $: isReadable = contrastLevel && contrastLevel >= 7;

  // Used for accessibility checking
  $: inferredTextCol =
    $preferences.textColor ||
    getColour(element.window.getComputedStyle(element.node).color);
</script>

<div class="cgb-component">
  <div
    class="colour-alert-box"
    class:alert-active={contrastLevel !== false && !isReadable}
    transition:slide
  >
    <ColourPicker
      label="Background Colour"
      id={element.id + "-setting-background"}
      bind:colour={$preferences.background}
      bind:contrastColour={inferredTextCol}
      {popupDirection}
    />
    <ColourPicker
      label="Text Colour"
      id={element.id + "-setting-text-colour"}
      bind:colour={$preferences.textColor}
      bind:contrastColour={$preferences.background}
      {popupDirection}
      showAccessible={false}
    />
    <!-- Warning if contrast is dangerously low -->
    {#if contrastLevel && contrastLevel < 7}
      <p class="alert-details">
        <span class="font-bold">Warning:</span> The contrast ratio between the
        background and text colours is only {contrastLevel.toFixed(2)}:1. Most
        text should be 7:1 (AAA), or at least 4.5:1 (AA).
      </p>
    {/if}
  </div>
</div>

<style lang="postcss">
  .colour-alert-box {
    @apply ring-0 ring-orange-300 p-2 rounded transition;
    &.alert-active {
      @apply shadow-md text-orange-800 ring-2 font-bold;
    }
    & .alert-details {
      @apply text-xs italic;
    }
  }
</style>
