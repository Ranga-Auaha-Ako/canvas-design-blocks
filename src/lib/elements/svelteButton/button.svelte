<script lang="ts">
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { ButtonData } from "./button";
  import { createEventDispatcher, onDestroy } from "svelte";

  const dispatch = createEventDispatcher();

  export let cdbData: ButtonData;
  // svelte-ignore unused-export-let
  export let localState: any;
  // svelte-ignore unused-export-let
  export let instance: any;
  export let destroyHandler: () => void;

  onDestroy(() => {
    destroyHandler();
  });
</script>

<a
  class="DesignBlocks--Btn {cdbData.size}"
  class:Button--full={cdbData.fullWidth}
  style:background-color={cdbData.color?.toHex()}
  style:color|important={cdbData.textColor?.toHex() || "#fff"}
  href={cdbData.url}
  target={cdbData.target !== "_self" ? cdbData.target : undefined}
>
  {#if cdbData.icon}
    <IconElement
      icon={cdbData.icon}
      colorOverride={cdbData.textColor?.toHex() || "#fff"}
    />
  {/if}
  <span class="text">{cdbData.label}</span>
</a>
