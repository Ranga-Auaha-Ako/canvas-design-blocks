<script lang="ts">
  import IconElement from "$lib/util/components/iconSearch/iconElement.svelte";
  import { ProgressNavData } from "./progressNav";
  import { createEventDispatcher, onDestroy } from "svelte";

  const dispatch = createEventDispatcher();

  export let cdbData: ProgressNavData;
  // svelte-ignore unused-export-let
  export let localState: any;
  export let destroyHandler: () => void;

  onDestroy(() => {
    destroyHandler();
  });
</script>

<div class="DesignBlocks--ProgressNav {cdbData.size}">
  {#each cdbData.items as item}
    <a
      class="ProgressNav--Module"
      style:background-color={item.color?.toHex()}
      style:color="#fff"
      href={item.url}
    >
      <span class="Module--icon">
        {#if item.icon}
          <IconElement icon={item.icon} colorOverride={"#fff"} />
        {:else}
          <span class="icon">
            <i class="icon-Line icon-module" />
          </span>
        {/if}
      </span>
      <span class="Module--label">{item.label}</span>
    </a>
  {:else}
    <!-- No items -->
    <p>
      No Published Modules Found! Try adding some to your course to see this.
    </p>
  {/each}
</div>
