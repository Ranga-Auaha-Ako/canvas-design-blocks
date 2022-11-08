<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  import GridLayouts from "$lib/components/layoutEditor/gridLayouts.svelte";

  export let append = false;

  export let expanded = false;

  const addRow = (e: CustomEvent) => {
    dispatch("addRow", { offset: append ? 1 : 0, template: e.detail });
  };
</script>

<button
  on:click|stopPropagation={() => {
    expanded = !expanded;
  }}
>
  <span>+</span>
  {#if expanded}
    <GridLayouts
      on:cancel={() => {
        expanded = false;
      }}
      on:add={addRow}
    />
  {/if}
</button>

<style lang="postcss">
  button {
    @apply left-0 right-0 mx-auto h-5 w-5;
    @apply leading-none flex items-center justify-center align-middle;
    @apply rounded-full border-0 bg-uni-blue shadow text-white;
  }
</style>
