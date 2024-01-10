<script lang="ts">
  import { type Icon, ValidThemes, IconTheme } from "../icon";
  import { fade, slide } from "svelte/transition";
  import IconPicker from "$lib/icons/svelte/iconPicker.svelte";
  import { colord } from "colord";
  import { onDestroy } from "svelte";
  import ColourPicker from "$lib/util/components/colourPicker.svelte";
  import { nanoid } from "nanoid";
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { getIconData } from "$lib/icons/svelte/iconPicker";

  export let props: { icon: Icon };
  export let isModal: boolean = false;
  $: icon = props.icon;
  $: iconData = icon.SvelteState;
  $: iconInfo = $iconData.icon ? getIconData($iconData.icon) : undefined;
  const iconPicker = new IconPicker({
    target: document.body,
    props: {
      options: { editColor: false },
    },
  });
  iconPicker.$on("selectIcon", ({ detail }) => {
    iconPicker.close();
    $iconData.icon = {
      id: detail.icon.i,
      type: detail.type,
    };
  });
  onDestroy(() => {
    iconPicker.$destroy();
  });
  $: contrastLevel = $iconData.color?.contrast(colord("#ffffff"));
  $: isReadable =
    contrastLevel === undefined || (contrastLevel && contrastLevel >= 7);
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="cgb-component" in:fade|global={{ duration: 200 }}>
  <button
    class="close"
    title="Close"
    on:click={() => {
      icon.deselectAll();
    }}
  >
    <i class="icon-end" />
  </button>
  <div class="main">
    <div class="flex gap-4 justify-center">
      <div class="col flex-grow flex-shrink">
        <ColourPicker
          label="Colour"
          id={nanoid() + "-setting-background"}
          bind:colour={$iconData.color}
          contrastColour={colord("#ffffff")}
          showNone={false}
          asModal={isModal}
        />
        <button
          class="Button"
          on:click={() => {
            iconPicker.open();
          }}>Select Icon</button
        >
        {#if !isReadable}
          <div class="colour-alert" transition:slide|global>
            <p class="alert-details">
              <span class="font-bold">Warning:</span> This icon may be hard to see
              for some students. Consider using a darker colour to improve contrast
              against the white background.
            </p>
          </div>
        {/if}
      </div>
      <div class="col w-24 p-2 flex-shrink-0">
        <!-- Preview area for icon -->
        <div class="icon-preview">
          {#if $iconData.icon}
            <IconElement icon={$iconData.icon} colour={$iconData.color} />
          {:else}
            <span>?</span>
          {/if}
        </div>
        {#await iconInfo}
          <p>Loading...</p>
        {:then info}
          {#if info}
            <p class="text-center text-xs">
              {info.c}: {info.n}
            </p>
          {/if}
        {:catch error}
          <p class="text-center text-xs">Error loading icon info</p>
        {/await}
      </div>
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
    .colour-alert {
      @apply border-l-4 border-orange-300 bg-orange-100 text-orange-900 p-2 rounded transition text-xs;
      p {
        @apply m-0;
      }
    }
    .icon-preview {
      @apply rounded shadow-inner bg-gray-50 flex items-center justify-center aspect-square;
      font-size: 3em;
    }
  }
</style>
