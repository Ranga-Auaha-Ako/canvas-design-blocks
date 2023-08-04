<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let icon: string;
</script>

<span class="icon">
  {#if import.meta.env.CANVAS_BLOCKS_ICONS_ASSET_HOST}
    <img src={icon} alt="" />
    ----THISHSOULDNOTBEEXPORTED---
  {:else}
    <i class={icon} />
  {/if}
</span>
