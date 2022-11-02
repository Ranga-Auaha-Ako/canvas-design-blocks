<script lang="ts">
  import { stateObject } from "$lib/grid/gridManager";
  import preventBubble from "$lib/util/preventBubble";
  import { createEventDispatcher, onMount } from "svelte";
  const dispatch = createEventDispatcher();

  export let state: stateObject;

  $: open = state.showInterface;

  let container: Element;

  onMount(() => {
    preventBubble(container, true);
  });
</script>

<div bind:this={container} class="cgb-toolbar">
  <button
    class="btn btn-primary cgb-openButton"
    on:click={() => {
      $open = true;
      dispatch("open");
    }}
  >
    Open Grid Editor
  </button>
</div>

<style lang="postcss">
  .cgb-toolbar {
    @apply inline-block float-right;
  }
  .cgb-openButton {
    @apply ml-1;
  }
</style>
