<script lang="ts">
  import { IconType } from "$lib/icons/svelte/canvas-icons/icons";
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { stateStatus } from "../pageMatcher.svelte";

  // Used in PageMatcher to indicate progress through creating a glossary page
  export let type: string;
  export let state: stateStatus;
</script>

<div
  class="p-2 rounded-sm border-0 border-l-4"
  class:border-blue-600={state !== stateStatus.CREATED}
  class:border-green-600={state === stateStatus.CREATED}
  class:bg-blue-50={state !== stateStatus.CREATED}
  class:bg-green-50={state === stateStatus.CREATED}
>
  <div class="flex gap-2 items-center">
    <div
      class="rounded-full aspect-square w-7 h-7 shrink-0 text-center leading-7 text-xs bg-blue-600 text-white"
      class:bg-green-600={state === stateStatus.CREATED}
    >
      {#if state === stateStatus.CREATED}
        <IconElement
          icon={{ id: "Inst.Line.check-dark", type: IconType.Custom }}
        />
      {:else if state === stateStatus.HIDDEN}
        <IconElement icon={{ id: "Inst.Line.off", type: IconType.Custom }} />
      {:else if state === stateStatus.UNLINKED}
        <IconElement
          icon={{ id: "Inst.Line.remove-link", type: IconType.Custom }}
        />
      {:else}
        <IconElement icon={{ id: "Inst.Line.x", type: IconType.Custom }} />
      {/if}
    </div>
    <!-- Info -->
    <h5 class="grow my-0">
      {type}
      {state}
    </h5>
  </div>
  <p class="m-2 italic">
    <slot></slot>
  </p>
</div>
