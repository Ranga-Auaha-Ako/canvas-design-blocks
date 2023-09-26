<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    IconState,
    IconType,
    getIconData,
    isCustomIcon,
    isInstIcon,
  } from "./iconPicker";
  const dispatch = createEventDispatcher();

  export let icon: IconState;

  $: typeClass = icon.type == IconType.Solid ? "icon-Solid" : "icon-Line";
  $: data = getIconData(icon);
</script>

{#if data}
  {#if isCustomIcon(icon)}
    <img src={data.url} alt="" />
  {:else if isInstIcon(icon)}
    <span class="icon" style:color={icon.color}>
      <i
        class="{typeClass} icon-{icon.class}"
        style:--cdb-icon="url({data.url})"
        data-mce-style=""
      />
    </span>
  {/if}
{/if}
