<script lang="ts">
  import Row from "$lib/elements/grid/row";
  import type { Writable } from "svelte/store";
  import { colord, type Colord } from "colord";
  import ColourPicker, {
    getColour,
  } from "$lib/util/components/colourPicker.svelte";
  import { slide } from "svelte/transition";
  import MceElement from "$lib/elements/generic/mceElement";
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
  $: inferredTextCol = $preferences.textColor || getApproxInferredColor();

  const getApproxInferredColor = () => {
    if ($preferences.textColor) return $preferences.textColor;
    const foundCol = getColour(
      element.window.getComputedStyle(element.node).color
    );
    if (!foundCol) return foundCol;
    // snap to black or white if colour is too dark or light
    let altCol = foundCol;
    if (foundCol.luminance() < 0.05) {
      altCol = colord("#000");
    } else if (foundCol.luminance() > 0.95) {
      altCol = colord("#fff");
    }
    return altCol;
  };

  // Set text colour to static if background colour is set
  $: if ($preferences.background && !$preferences.textColor) {
    $preferences.textColor = getApproxInferredColor();
  }
</script>

<div class="cgb-component">
  <div
    class="colour-alert-box"
    class:alert-active={contrastLevel !== false && !isReadable}
    transition:slide|global
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
      isText={true}
    />
    <!-- Warning if contrast is dangerously low -->
    {#if contrastLevel && contrastLevel < 7}
      <div class="colour-alert" transition:slide|global>
        <p class="alert-details">
          <span class="font-bold">Warning:</span> Text and icons smaller than 18pt
          (or bold 14pt) should display a minimum contrast ratio of 4.5:1. Consider
          using a darker colour if you are using this icon in a smaller size.
        </p>
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  .colour-alert-box {
    @apply ring-0 ring-orange-300 p-2 rounded transition;
    &.alert-active {
      @apply shadow-md text-orange-800 ring-2;
    }
  }
  .colour-alert {
    @apply mt-2 border-l-4 border-orange-300 bg-orange-100 text-orange-900 p-2 rounded transition text-xs;
    p {
      @apply m-0;
    }
  }
</style>
