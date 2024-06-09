<script lang="ts">
  import { type __Name, ValidThemes, __NameTheme } from "../__name";
  import { fade, slide } from "svelte/transition";
  import ButtonRadio from "$lib/components/buttonRadio.svelte";
  import LinkInput from "$lib/components/contentSearch/linkEditor/linkInput.svelte";

  export let props: { __name: __Name };
  $: __name = props.__name;
  $: __nameData = __name.SvelteState;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="cgb-component" in:fade|global={{ duration: 200 }}>
  <button
    class="close"
    title="Close"
    on:click={() => {
      __name.deselectAll();
    }}
  >
    <i class="icon-end" />
  </button>
  <div class="grid grid-flow-col grid-cols-2 gap-4">
    <div class="col">
      <ButtonRadio
        title="__Name Theme"
        choices={ValidThemes}
        labels={Object.keys(__NameTheme)}
        bind:value={$__nameData.theme}
      />
      <input
        type="text"
        bind:value={$__nameData.title}
        placeholder="__Name Title..."
      />
      <LinkInput
        link={$__nameData.url}
        on:save={({ detail }) => {
          $__nameData.url = detail.link;
        }}
      />
    </div>
  </div>
</div>

<style lang="postcss">
  .cgb-component {
    @apply bg-white border border-gray-300 rounded pt-6 p-2 shadow mb-2;
    @apply grid grid-cols-1 max-w-lg w-screen gap-4;
    & > .close {
      @apply absolute top-0 right-0 p-1 z-20;
      @apply opacity-100;
      line-height: 0;
      i {
        @apply text-gray-600;
        line-height: 0;
      }
    }
    .col {
      @apply flex flex-col gap-2;
    }
  }
  input[type="text"],
  input[type="url"] {
    @apply border border-gray-300 rounded px-2 py-3 w-full mb-0;
    &:focus {
      @apply outline-none border-blue-500;
    }
  }
</style>
