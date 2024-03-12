<!-- This component is used when the user hasn't previously opened the panel -->
<script lang="ts">
  import { fade, slide } from "svelte/transition";
</script>

<div>
  <div class="tooltip">
    <h3>Design Blocks</h3>
  </div>
</div>

<style lang="postcss">
  .tooltip {
    @apply p-4 w-full max-w-prose;
    h3 {
      @apply text-center text-lg;
    }
  }
</style>
