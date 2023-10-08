<script lang="ts">
  import {
    type Button,
    ValidThemes,
    ButtonTheme,
    ButtonSize,
    ValidSizes,
  } from "../button";
  import { fade } from "svelte/transition";
  import ButtonRadio from "$lib/util/components/buttonRadio.svelte";
  import { nanoid } from "nanoid";
  import IconPicker from "$lib/util/components/iconSearch/iconPicker";
  import ColourPicker from "$lib/util/components/colourPicker.svelte";
  import { colord } from "colord";
  import LinkInput from "$lib/util/components/linkEditor/linkInput.svelte";

  export let props: { button: Button };
  export let isModal: boolean = false;
  // export let isDominant: Writable<boolean>;
  // export let dominantPopover: Readable<boolean> | undefined = undefined;
  $: button = props.button;
  $: buttonData = button.SvelteState;

  $: inGrid = props.button.node.closest(".cgb-col:not(.col-lg-12)") !== null;
  let configEl: HTMLElement;

  let iconPicker: IconPicker;
  let pickerUnsub = () => {};
  $: {
    iconPicker = new IconPicker(button.editor, $buttonData.icon, button);
    pickerUnsub();
    pickerUnsub = iconPicker.subscribe((icon) => {
      $buttonData.icon = icon;
    });
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={configEl}
  class="cgb-component"
  in:fade|global={{ duration: 200 }}
>
  <button
    class="close"
    title="Close"
    on:click={() => {
      button.deselectAll();
    }}
  >
    <i class="icon-end" />
  </button>
  <div class="grid grid-flow-col grid-cols-2 gap-4">
    <div class="col">
      <ButtonRadio
        title="Button Size"
        choices={ValidSizes}
        labels={Object.keys(ButtonSize)}
        bind:value={$buttonData.size}
      />
      <input
        type="text"
        bind:value={$buttonData.title}
        placeholder="Button Title..."
      />
      <input
        type="text"
        bind:value={$buttonData.label}
        placeholder="Button Label..."
      />
      <LinkInput
        link={$buttonData.url}
        text={$buttonData.label}
        on:save={({ detail }) => {
          $buttonData.url = detail.link;
          $buttonData.label = detail.text || "";
        }}
      />
    </div>
    <div class="col">
      <ColourPicker
        label="Colour"
        id={nanoid() + "-setting-background"}
        bind:colour={$buttonData.color}
        contrastColour={colord("#ffffff")}
        showNone={false}
        asModal={isModal}
      />
      <button
        class="Button"
        on:click={() => {
          iconPicker.pick();
        }}>Select Icon</button
      >
      <!-- Select box for full-width -->
      {#if inGrid}
        <label for="fullWidth" class="checkbox-fullwidth">
          <input
            type="checkbox"
            id="fullWidth"
            bind:checked={$buttonData.fullWidth}
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
