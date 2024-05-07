<script lang="ts">
  import {
    type Icon,
    ValidThemes,
    IconTheme,
    ValidSizes,
    iconSize,
  } from "../icon";
  import { fade, slide } from "svelte/transition";
  import IconPicker from "$lib/icons/svelte/iconPicker.svelte";
  import { colord } from "colord";
  import { onDestroy } from "svelte";
  import { nanoid } from "nanoid";
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import { getIconData, icons } from "$lib/icons/svelte/iconPicker";
  import IconList from "$lib/icons/svelte/canvas-icons/iconList.svelte";
  import { findNearestBackgroundColor } from "$lib/util/deriveColour";
  import ButtonRadio from "$lib/util/components/buttonRadio.svelte";

  export let props: { icon: Icon };
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
        <div class="iconListContainer">
          <IconList
            {icons}
            targetNode={icon.node}
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
        {#if iconInfo}
          <p class="text-center text-xs">
            {iconInfo.c}: {iconInfo.n}
          </p>
        {/if}
        <ButtonRadio
          fullWidth={true}
          title="Icon Size"
          axis="vertical"
          choices={ValidSizes}
          labels={Object.keys(iconSize)}
          bind:value={$iconData.size}
          let:index
        >
          {#if index !== 0}
            <span class="icon-dot" style:--dot--size={index}></span>
          {/if}
          <span class="grow">{Object.keys(iconSize)[index]}</span>
        </ButtonRadio>
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
    .icon-preview {
      @apply rounded shadow-inner bg-gray-50 flex items-center justify-center aspect-square;
      font-size: 3em;
    }
  }
  .icon-dot {
    @apply w-4 h-4 rounded-full bg-primary shrink-0;
    transform: scale(calc((var(--dot--size) + 1) / 6));
  }
  :global(.active) > .icon-dot {
    @apply bg-white;
  }
</style>
