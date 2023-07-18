<script lang="ts">
  import type { Writable } from "svelte/store";
  import { type CourseHeader, ValidThemes, HeaderTheme } from "../courseHeader";
  import { ModalDialog } from "$lib/util/components/modalDialog/modal";
  import { fade } from "svelte/transition";
  import { debounce } from "perfect-debounce";
  import Sortable from "sortablejs";
  import ButtonRadio from "$lib/util/components/buttonRadio.svelte";

  export let props: { courseHeader: CourseHeader };
  // export let isDominant: Writable<boolean>;
  // export let dominantPopover: Readable<boolean> | undefined = undefined;
  $: courseHeader = props.courseHeader;
  $: headerData = courseHeader.SvelteState;
  let configEl: HTMLElement;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={configEl}
  class="cgb-component"
  in:fade|global={{ duration: 200 }}
>
  <div>
    <ButtonRadio
      title="Header Theme"
      choices={ValidThemes}
      labels={Object.keys(HeaderTheme)}
      bind:value={$headerData.theme}
    />
  </div>
</div>

<style lang="postcss">
  .cgb-component {
    @apply bg-white border border-gray-300 rounded p-2 shadow mb-2;
    @apply flex gap-4;
    &:after {
      @apply block absolute rounded mx-auto inset-x-0 w-4 h-4 rotate-45 bottom-0;
      @apply border-b border-r bg-white -z-10;
      content: " ";
    }
  }
</style>
