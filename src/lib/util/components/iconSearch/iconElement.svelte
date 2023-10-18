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

  $: typeClass = icon.type === IconType.Solid ? "icon-Solid" : "icon-Line";
  $: data = getIconData(icon);

  const getCustomIcon = (
    icon: CustomIconState,
    data: instIcon | customIcon
  ) => {
    const partColor = color?.toHex()?.split("#")[1];
    if (!partColor) {
      return `https://${import.meta.env.CANVAS_BLOCKS_USE_CANVAS_ICONS}/icons/${
        data.url
      }`;
    } else {
      const partUrl = data.url.split(".svg")[0];
      return `https://${
        import.meta.env.CANVAS_BLOCKS_USE_CANVAS_ICONS
      }/colour/${partUrl}.${partColor}.svg`;
    }
  };
</script>

{#await data then d}
  {#if d}
    {#if isCustomIcon(icon)}
      <img
        class="cdb--custom-icon"
        src={getCustomIcon(icon, d)}
        alt=""
        aria-hidden="true"
        role="presentation"
      />
    {:else if isInstIcon(icon)}
      <span class="icon" style:color={icon.color}>
        <i
          class="{typeClass} icon-{d.term}"
          style:--cdb-icon="url({d.url})"
          data-mce-style=""
        />
      </span>
    {/if}
  {/if}
{/await}
