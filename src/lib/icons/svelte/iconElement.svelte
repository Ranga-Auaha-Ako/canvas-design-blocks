<script lang="ts">
  import { findNearestBackgroundColor } from "$lib/util/deriveColour";
  import { IconState, getIconData, isCustomIcon } from "./iconPicker";
  import { colord, type Colord } from "colord";

  export let icon: IconState;
  export let colorOverride: string | undefined = undefined;

  $: color = (
    colorOverride || icon.color
      ? colord(colorOverride || icon.color!)
      : undefined
  ) as Colord | undefined;

  $: data = getIconData(icon);

  $: elWindow = iconEl?.ownerDocument.defaultView;
  let iconEl: HTMLSpanElement | undefined;
  $: shouldEnforceBackground = iconEl
    ? colord(
        findNearestBackgroundColor(iconEl, elWindow ? elWindow : undefined)
      ).alpha() === 0
    : false;
  // This is required because in some cases Safari doesn't normalize the node to have a single inner text, and having split text nodes breaks the ligatures holding the icon together.
  $: if (iconEl && data?.c && data?.l) iconEl.normalize();
</script>

{#if data}
  <span
    class="cdb--icon"
    aria-hidden="true"
    style:color={color?.toHex() || undefined}
    data-mce-style={color ? `color: ${color?.toHex()}` : undefined}
    class:safeBackground={shouldEnforceBackground}
    bind:this={iconEl}>{`${data.c}.${data.l}`}</span
  >
{/if}
