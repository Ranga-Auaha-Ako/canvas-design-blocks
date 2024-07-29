<script lang="ts">
  import PopoverWrapper from "$lib/elements/generic/popover/popoverWrapper.svelte";
  import { nanoid } from "nanoid";
  import { type ComponentType, createEventDispatcher, onMount } from "svelte";
  import { slide } from "svelte/transition";
  import ElementTooltip from "./elementTooltip.svelte";
  export let name: string = "Element";
  // export let title = `Add ${name}`;
  export let description: string;
  export let video: string | undefined = undefined;

  let buttonRef: HTMLButtonElement | null = null;

  let showTooltip: (() => void) | undefined;
  let hideTooltip: (() => void) | undefined;

  const dispatch = createEventDispatcher();
</script>

<div class="cgb-component">
  <button
    bind:this={buttonRef}
    on:click={() => dispatch("add")}
    on:mouseover={() => {
      if (showTooltip) showTooltip();
    }}
    on:focus={() => {
      if (showTooltip) showTooltip();
    }}
    on:mouseout={() => {
      if (hideTooltip) hideTooltip();
    }}
    on:blur={() => {
      if (hideTooltip) hideTooltip();
    }}
    class="pane"
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
  {#if buttonRef}
    <ElementTooltip
      target={buttonRef}
      {description}
      {video}
      bind:showTooltip
      bind:hideTooltip
    ></ElementTooltip>
  {/if}
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

  :global(body.cdb--dark) {
    .pane {
      @apply bg-black text-white border-gray-600;
      &:hover {
        @apply bg-gray-800;
      }
      &:active {
        @apply bg-gray-900;
      }
    }
  }
</style>
