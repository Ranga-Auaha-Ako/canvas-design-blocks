<script lang="ts">
    import { Writable } from "svelte/store";
  import Column from "../grid/column";
  
  
      export let column: Column;
        $: width = column.width;
  </script>
  
  <div class="gridViewCol" style={`--gridViewColWidth:${($width.xs/12)*100}%;`}>
    {$width.xs}
  </div>
  
  <style lang="postcss">
    .gridViewCol {
      width: var(--gridViewColWidth);
      @apply rounded shadow;
      @apply bg-uni-blue-light p-2 text-white text-lg font-bold;
      @apply inline-flex items-center justify-center;
    }
  </style>