<script lang="ts">
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  let display = false;
  onMount(() => {
    display = true;
  });
</script>

{#if display}
  <div class="cgb-component">
    <div class="announcement" in:slide|global>
      <p class="m-0 font-bold">Canvas Design Blocks is moving to a new home</p>
      <p class="m-0">
        This tool is now integrated into Canvas, and you can safely uninstall
        the browser extension.
      </p>
    </div>
  </div>
{/if}

<style lang="postcss">
  .announcement {
    @apply px-3 py-2 border-uni-blue bg-uni-blue text-white transition-colors border rounded mb-2 overflow-clip text-sm;
  }
</style>
