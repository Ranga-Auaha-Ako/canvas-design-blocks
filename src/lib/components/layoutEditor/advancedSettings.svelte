<script lang="ts">
  import ColPicker from "./advancedSettings/colPicker.svelte";

  import Row from "$lib/grid/row";
  import { get } from "svelte/store";

  export let row: Row;
  $: columns = row.columns;

  let activeColumn = 0;
</script>

<div class="advancedSettings">
  <h5>Advanced Settings</h5>
  <ColPicker {row} />
</div>

<style lang="postcss">
  h5 {
    @apply w-full font-bold;
    &:after {
      @apply block w-16 bg-uni-blue;
      height: 3px;
      content: " ";
    }
  }
</style>
