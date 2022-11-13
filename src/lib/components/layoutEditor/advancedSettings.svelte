<script lang="ts">
  import ColPicker from "./advancedSettings/colPicker.svelte";

  import Row from "$lib/grid/row";
  import { get } from "svelte/store";
  import { nanoid } from "nanoid";

  export let row: Row;
  $: columns = row.columns;

  $: props = row.properties;

  let activeColumn = 0;

  const ids = {
    padding: nanoid(),
    shadow: nanoid(),
  };
</script>

<div class="advancedSettings">
  <h5>Advanced Settings</h5>
  <ColPicker {row} />
  <label for={ids.padding}>
    Padding ({$props.padding}px)
    <input
      id={ids.padding}
      type="range"
      min="0"
      max="20"
      bind:value={$props.padding}
    />
  </label>
  <label for={ids.shadow}>
    Shadow ({$props.shadow})
    <input id={ids.shadow} type="checkbox" bind:checked={$props.shadow} />
  </label>
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
