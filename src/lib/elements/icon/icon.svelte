<script lang="ts">
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { colord } from "colord";
  import { IconData } from "./icon";
  import { createEventDispatcher, onDestroy } from "svelte";

  const dispatch = createEventDispatcher();

  export let cdbData: IconData;
  // svelte-ignore unused-export-let
  export let localState: any;
  export let destroyHandler: () => void;

  onDestroy(() => {
    destroyHandler();
  });
</script>

<span class="DesignBlocks--Icon {cdbData.theme} {cdbData.size}">
  {#if cdbData.icon}
    <IconElement icon={cdbData.icon} colorOverride={cdbData.color?.toHex()} />
  {:else}
    <span class="iconPlaceholder"> &nbsp; </span>
  {/if}
</span>
