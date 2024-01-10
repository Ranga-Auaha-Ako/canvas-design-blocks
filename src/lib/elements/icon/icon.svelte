<script lang="ts">
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
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

<div class="DesignBlocks--Icon {cdbData.theme}">
  {#if cdbData.icon}
    <IconElement icon={cdbData.icon} colorOverride={cdbData.color?.toHex()} />
  {:else}
    <i className="icon-line icon-empty" aria-hidden="true" />
  {/if}
</div>
