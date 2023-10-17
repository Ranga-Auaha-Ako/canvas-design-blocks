<script lang="ts">
  import { type ProgressNav, ValidSizes } from "../progressNav";
  import { fade } from "svelte/transition";
  import ProgressNavRadio from "$lib/util/components/progressNavRadio.svelte";
  import { nanoid } from "nanoid";
  import IconPicker from "$lib/util/components/iconSearch/iconPicker.svelte";
  import ColourPicker from "$lib/util/components/colourPicker.svelte";
  import { colord } from "colord";
  import LinkInput from "$lib/util/components/contentSearch/linkEditor/linkInput.svelte";
  import { onDestroy } from "svelte";

  export let props: { progressNav: ProgressNav };
  export let isModal: boolean = false;
  // export let isDominant: Writable<boolean>;
  // export let dominantPopover: Readable<boolean> | undefined = undefined;
  $: progressNav = props.progressNav;
  $: progressNavData = progressNav.SvelteState;

  $: inGrid =
    props.progressNav.node.closest(".cgb-col:not(.col-lg-12)") !== null;
  let configEl: HTMLElement;

  const iconPicker = new IconPicker({
    target: document.body,
    props: {
      options: { editColor: false },
    },
  });
  iconPicker.$on("selectIcon", ({ detail }) => {
    iconPicker.close();
    $progressNavData.icon = {
      id: detail.icon.id,
      type: detail.type,
    };
  });
  onDestroy(() => {
    iconPicker.$destroy();
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={configEl}
  class="cgb-component"
  in:fade|global={{ duration: 200 }}
>
  <progressNav
    class="close"
    title="Close"
    on:click={() => {
      progressNav.deselectAll();
    }}
  >
    <i class="icon-end" />
  </progressNav>
  <div class="grid grid-flow-col grid-cols-2 gap-4">
    <div class="col">
      <ProgressNavRadio
        title="ProgressNav Size"
        choices={ValidSizes}
        labels={Object.keys(ProgressNavSize)}
        bind:value={$progressNavData.size}
      />
      <input
        type="text"
        bind:value={$progressNavData.title}
        placeholder="ProgressNav Title..."
      />
      <input
        type="text"
        bind:value={$progressNavData.label}
        placeholder="ProgressNav Label..."
      />
      <LinkInput
        link={$progressNavData.url}
        text={$progressNavData.label}
        on:save={({ detail }) => {
          $progressNavData.url = detail.link;
          $progressNavData.label = detail.text || "";
        }}
      />
    </div>
    <div class="col">
      <ColourPicker
        label="Colour"
        id={nanoid() + "-setting-background"}
        bind:colour={$progressNavData.color}
        contrastColour={colord("#ffffff")}
        showNone={false}
        asModal={isModal}
      />
      <progressNav
        class="ProgressNav"
        on:click={() => {
          iconPicker.open();
        }}>Select Icon</progressNav
      >
      <!-- Select box for full-width -->
      {#if inGrid}
        <label for="fullWidth" class="checkbox-fullwidth">
          <input
            type="checkbox"
            id="fullWidth"
            bind:checked={$progressNavData.fullWidth}
          />
          Full Width
        </label>
      {/if}
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
  .checkbox-fullwidth {
    @apply flex items-center gap-2;
    @apply text-gray-500;
    @apply cursor-pointer;
    @apply accent-primary;
    & input {
      @apply w-4 h-4;
    }
  }
</style>
