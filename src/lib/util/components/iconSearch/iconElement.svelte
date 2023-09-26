<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    CustomIconState,
    IconState,
    IconType,
    getIconData,
    isCustomIcon,
    isInstIcon,
    loadCustomIcons,
  } from "./iconPicker";
  import { customIcon, iconData, instIcon } from "./canvas-icons/icons";
  const dispatch = createEventDispatcher();

  export let icon: IconState;

  $: typeClass = icon.type === IconType.Solid ? "icon-Solid" : "icon-Line";
  $: data = getIconData(icon);

  const getCustomIcon = (
    icon: CustomIconState,
    data: instIcon | customIcon
  ) => {
    const partColor = icon.color?.split("#")[1];
    if (!partColor) {
      return `https://${import.meta.env.CANVAS_BLOCKS_USE_CANVAS_ICONS}/${
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
      <img class="cdb--custom-icon" src={getCustomIcon(icon, d)} alt="" />
    {:else if isInstIcon(icon)}
      <span class="icon" style:color={icon.color}>
        <i
          class="{typeClass} icon-{icon.class}"
          style:--cdb-icon="url({d.url})"
          data-mce-style=""
        />
      </span>
    {/if}
  {/if}
{/await}
