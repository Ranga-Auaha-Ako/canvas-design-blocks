<script lang="ts">
  import { type Icon, ValidThemes, IconTheme } from "../icon";
  import { fade, slide } from "svelte/transition";
  import IconPicker from "$lib/icons/svelte/iconPicker.svelte";
  import { colord } from "colord";
  import { onDestroy } from "svelte";
  import ColourPicker from "$lib/util/components/colourPicker.svelte";
  import { nanoid } from "nanoid";
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { getIconData, icons } from "$lib/icons/svelte/iconPicker";
  import IconList from "$lib/icons/svelte/canvas-icons/iconList.svelte";

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
        {#await icons}
          <span class="cdb--icon icon-loading">Canvas.refresh</span>
        {:then allIcons}
          <div class="iconListContainer">
            <IconList
              icons={allIcons}
              options={{
                editColor: true,
                card: false,
                maxHeight: "60vh",
              }}
              on:colorChange={({ detail }) => {
                if (detail.color) $iconData.color = colord(detail.color);
              }}
              on:selectIcon={({ detail }) => {
                $iconData.icon = {
                  id: detail.icon.i,
                  type: detail.type,
                };
                if (detail.color) $iconData.color = colord(detail.color);
                icon.deselectAll();
              }}
              asModal={true}
            />
          </div>
        {/await}
      </div>
      <div class="col w-24 p-2 flex-shrink-0">
        <!-- Preview area for icon -->
        <div class="icon-preview">
          {#if $iconData.icon}
            <IconElement
              icon={$iconData.icon}
              colorOverride={$iconData.color?.toHex()}
            />
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
    .icon-loading {
      @apply text-3xl animate-spin block text-center opacity-50 mx-auto p-4;
    }
  }
</style>
