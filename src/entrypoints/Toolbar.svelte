<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { stateObject } from "$lib/grid/gridManager";
  import Portal from "$lib/portal/portal.svelte";
  import preventBubble from "$lib/util/preventBubble";
  import IconWhite from "$assets/brand/Icon_White.svg";
  const dispatch = createEventDispatcher();

  export let state: stateObject;

  $: open = state.showInterface;

  let container: Element;

  onMount(() => {
    preventBubble(container, true);
  });
</script>

<Portal>
  <div bind:this={container} class="cgb-toolbar">
    <button
      class="cgb-openButton"
      on:click={() => {
        $open = true;
        dispatch("open");
      }}
    >
      <img src={IconWhite} alt="" />
      <div class="details">Grids</div>
    </button>
  </div>
</Portal>

<style lang="postcss">
  .cgb-toolbar {
    @apply fixed top-12 z-40 overflow-clip;
    @apply flex flex-row items-center justify-center;
    @apply rounded-l shadow-md w-10 bg-uni-blue;
    @apply -right-6 pr-6 transition-all;
    &:hover {
      @apply right-0;
    }
  }
  .cgb-openButton {
    @apply bg-uni-blue text-white p-0 m-0 border-none w-full h-auto relative;
    & .details {
      @apply absolute text-xs top-0 left-4 w-full h-full;
      transform: rotate(90deg);
    }
  }
</style>
