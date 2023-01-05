<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  export let background: string | undefined = undefined;

  const dispatch = createEventDispatcher();
</script>

<div class="cgb-component">
  <button on:click={() => dispatch("add")} class="pane" style:background>
    <h3 class="element-name">
      <slot name="name" />
    </h3>
    <div class="">+</div>
  </button>
</div>

<style lang="postcss">
  .pane {
    @apply bg-white border-b p-3 py-2 relative w-full;
    @apply grid justify-items-start;
    grid-template-columns: 1fr auto;
    & .icon-help {
      @apply block w-4 h-4 leading-none;
    }
    & h3 {
      @apply block m-0 text-base;
    }
  }
</style>
