<script lang="ts">
  import { nanoid } from "nanoid";
  import { createEventDispatcher, onMount } from "svelte";
  export let name: string = "Element";
  export let title = `Add ${name}`;

  const dispatch = createEventDispatcher();
</script>

<div class="cgb-component">
  <button
    on:click={() => dispatch("add")}
    class="pane"
    {title}
    draggable="true"
    on:dragstart={(e) => {
      if (!e.dataTransfer) return;
      const id = `cdb-${nanoid()}`;
      e.dataTransfer.setData("cdb-element/name", name);
      e.dataTransfer.setData("cdb-element/id", id);
      e.dataTransfer.setData("text/plain", "");
      e.dataTransfer.setData(
        "text/html",
        `<span id="${id}" data-mce-type="bookmark" style="overflow:hidden;line-height:0px"></span>`
      );
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.dropEffect = "copy";
    }}
  >
    <h3 class="element-name">
      <slot name="name" />
    </h3>
    <div class="add-button">
      <slot name="icon">
        <div class="icon">
          <i class="icon-line icon-add" aria-hidden="true" />
        </div>
      </slot>
    </div>
  </button>
</div>

<style lang="postcss">
  .pane {
    @apply bg-white border-b px-2.5 py-2 relative w-full;
    @apply grid justify-items-start;
    @apply gap-2;
    @apply transition;
    grid-template-columns: 1fr auto;
    &:hover {
      @apply bg-gray-100 scale-105;
    }
    &:active {
      @apply bg-gray-200 scale-100;
    }
    & h3 {
      @apply block m-0 text-sm text-left;
    }
  }
</style>
