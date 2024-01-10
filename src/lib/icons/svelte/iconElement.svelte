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
</script>

{#await data}
  <span
    class="cdb--icon"
    style:color={color?.toHex() || undefined}
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
      style:color={color?.toHex() || undefined}
      data-mce-style={color ? `color: ${color?.toHex()}` : undefined}
    >
      {d.c}.{d.l}
    </span>
  {/if}
{/await}
