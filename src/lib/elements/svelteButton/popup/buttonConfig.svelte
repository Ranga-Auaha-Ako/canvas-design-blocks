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

  export let props: { button: Button };
  // export let isDominant: Writable<boolean>;
  // export let dominantPopover: Readable<boolean> | undefined = undefined;
  $: button = props.button;
  $: console.log(button);
  $: buttonData = button.SvelteState;
  let configEl: HTMLElement;

  $: iconPicker = new IconPicker(button.editor, undefined, button);
  $: selectedIcon = iconPicker.icon;
  $: $buttonData.icon = $selectedIcon;
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
  <div class="col">
    <ButtonRadio
      title="Button Theme"
      choices={ValidThemes}
      labels={Object.keys(ButtonTheme)}
      bind:value={$buttonData.theme}
    />
    <ButtonRadio
      title="Button Size"
      choices={ValidSizes}
      labels={Object.keys(ButtonSize)}
      bind:value={$buttonData.size}
    />
    <button
      class="Button"
      on:click={() => {
        iconPicker.pick();
      }}>Select Icon</button
    >
  </div>
</div>

<style lang="postcss">
  .cgb-component {
    @apply bg-white border border-gray-300 rounded pt-6 p-2 shadow mb-2;
    @apply grid grid-cols-1 max-w-lg w-screen gap-4;
    &:after {
      @apply block absolute rounded mx-auto inset-x-0 w-4 h-4 rotate-45 bottom-0;
      @apply border-b border-r bg-white -z-10;
      content: " ";
    }
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
</style>
