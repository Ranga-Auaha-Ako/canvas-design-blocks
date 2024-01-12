<script lang="ts">
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
