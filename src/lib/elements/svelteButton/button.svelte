<script lang="ts">
  import IconElement from "$lib/util/components/iconSearch/iconElement.svelte";
  import { ButtonData } from "./button";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let cdbData: ButtonData;
  export let localState: any;
</script>

<a
  class="DesignBlocks--Btn {cdbData.size}"
  style:background-color={cdbData.color?.toHex()}
  href={cdbData.url}
>
  {#if cdbData.icon}
    <IconElement icon={cdbData.icon} />
  {/if}
  <span class="text">{cdbData.label}</span>
</a>
