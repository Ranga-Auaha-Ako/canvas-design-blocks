<script lang="ts">
  import { rowTemplates } from "../grid/rowLayouts";
  import { createEventDispatcher } from "svelte";
  import { fade, slide } from "svelte/transition";
  const dispatch = createEventDispatcher();
  import { clickOutside } from "svelte-use-click-outside";
</script>

<div
  class="layoutList"
  in:slide
  out:fade
  use:clickOutside={() => dispatch("cancel")}
>
  {#each Object.entries(rowTemplates) as [name, template]}
    <div
      class="layout"
      title={name}
      role="button"
      tabindex="0"
      on:click={(e) => dispatch("add", template)}
    >
      {#each template.cols as col}
        <div
          class="col"
          style={`--gridViewColWidth:${(col.lg / 12) * 100}%;`}
        />
      {/each}
    </div>
  {/each}
</div>

<style lang="postcss">
  .layoutList {
    @apply grid grid-cols-3 gap-2 absolute top-0 w-full max-w-sm z-20;
    @apply bg-white p-2 rounded shadow-lg border-2 border-solid border-uni-blue-light;
    @nest & .layout {
      @apply relative;
      @apply bg-slate-100 p-2 rounded;
      @apply flex gap-2;
      @apply cursor-pointer transition;
      &:hover {
        @apply bg-slate-200;
      }
      @nest & .col {
        @apply h-5;
        @apply bg-uni-blue-light rounded;
        width: var(--gridViewColWidth);
      }
    }
  }
</style>
