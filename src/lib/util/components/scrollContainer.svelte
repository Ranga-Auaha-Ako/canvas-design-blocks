<script lang="ts">
  export const update = () => {
    setTimeout(() => {
      containerScroll = container?.scrollTop || 0;
      scrollDistance =
        (container?.scrollHeight || 0) -
        containerScroll -
        (container?.clientHeight || 0 + 10);
    }, 50);
  };
  export let card = true;
  export let maxHeight = "650px";

  let container: HTMLDivElement;
  let containerScroll = 0;
  let scrollDistance = 0;

  update();
</script>

<div
  class="overflow"
  class:active={scrollDistance > 0}
  class:card
  style:--maxHeight={maxHeight}
>
  <div
    class="scroll-container"
    bind:this={container}
    on:scroll={() => {
      update();
    }}
  >
    <slot />
  </div>
</div>

<style lang="postcss">
  .overflow {
    @apply relative rounded overflow-clip;
    &.card {
      @apply shadow;
    }
    &:after {
      @apply absolute h-4 bg-gradient-to-t from-gray-500 pointer-events-none;
      @apply bottom-0 left-0 w-full;
      @apply opacity-0 transition-opacity;
      content: " ";
    }
    &.active:after {
      @apply opacity-20;
    }
  }
  .scroll-container {
    @apply overflow-y-auto relative p-2 pt-0;
    max-height: calc(var(--maxHeight) - 9rem);
  }
</style>
