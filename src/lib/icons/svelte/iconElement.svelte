<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    CustomIconState,
    IconState,
    IconType,
    getIconData,
    isCustomIcon,
    isInstIcon,
    isUniversalIcon,
    loadCustomIcons,
  } from "./iconPicker";
  import { customIcon, iconData, instIcon } from "./canvas-icons/icons";
  import { colord, type Colord } from "colord";
  const dispatch = createEventDispatcher();

  export let icon: IconState;
  export let colorOverride: string | undefined = undefined;

  $: color = (
    colorOverride || icon.color
      ? colord(colorOverride || icon.color!)
      : undefined
  ) as Colord | undefined;

  $: data = getIconData(icon);

  $: elWindow = iconEl?.ownerDocument.defaultView;
  const findNearestBackgroundColor: (el: HTMLElement) => string = (el) => {
    if (el === elWindow?.document.body || !elWindow) {
      return "#0000";
    }
    const computedStyle = elWindow.getComputedStyle(el);
    const backgroundColor = computedStyle.backgroundColor;
    const c = colord(backgroundColor);
    if (c.alpha() === 0 && el.parentElement) {
      return findNearestBackgroundColor(el.parentElement);
    }
    return c.toHex();
  };
  let iconEl: HTMLSpanElement | undefined;
  $: shouldEnforceBackground = iconEl
    ? colord(findNearestBackgroundColor(iconEl)).alpha() === 0
    : false;
  $: console.log(
    shouldEnforceBackground,
    elWindow,
    iconEl
      ? [
          findNearestBackgroundColor(iconEl),
          colord(findNearestBackgroundColor(iconEl)),
        ]
      : "No iconEl"
  );
</script>

{#await data}
  <span
    class="cdb--icon"
    style:color={color?.toHex() || undefined}
    aria-hidden="true"
    data-mce-style={color ? `color: ${color?.toHex()}` : undefined}
  >
    {#if isCustomIcon(icon) && icon.lig}
      {icon.lig}
    {:else}
      &nbsp;
    {/if}
  </span>
{:then d}
  {#if d}
    <span
      class="cdb--icon"
      aria-hidden="true"
      style:color={color?.toHex() || undefined}
      data-mce-style={color ? `color: ${color?.toHex()}` : undefined}
      class:safeBackground={shouldEnforceBackground}
      bind:this={iconEl}
    >
      {d.c}.{d.l}
    </span>
  {/if}
{/await}
