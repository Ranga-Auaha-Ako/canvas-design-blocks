<script lang="ts">
  import { ProgressNav, ProgressNavSize, ValidSizes } from "../progressNav";
  import { fade } from "svelte/transition";
  import ButtonRadio from "$lib/util/components/buttonRadio.svelte";
  import { nanoid } from "nanoid";
  import IconPicker from "$lib/util/components/iconSearch/iconPicker.svelte";
  import ColourPicker from "$lib/util/components/colourPicker.svelte";
  import { colord } from "colord";
  import LinkInput from "$lib/util/components/contentSearch/linkEditor/linkInput.svelte";
  import { onDestroy } from "svelte";
  import OrderableList from "$lib/util/components/orderableList.svelte";
  import { Writable } from "svelte/store";
  import { LocalState } from "$lib/elements/imageCard/imageCard";
  import ItemPages from "$lib/util/components/itemPages/itemPages.svelte";

  export let props: {
    progressNav: ProgressNav;
  };

  export let isModal: boolean = false;
  let selectedId: string | undefined = undefined;
  $: progressNav = props.progressNav;
  $: progressNavData = progressNav.SvelteState;
  $: cardIndex =
    selectedId !== undefined
      ? ProgressNav.getItemIndex($progressNavData, selectedId)
      : undefined;

  let configEl: HTMLElement;

  const iconPicker = new IconPicker({
    target: document.body,
    props: {
      options: { editColor: false },
    },
  });
  iconPicker.$on("selectIcon", ({ detail }) => {
    iconPicker.close();
    if (cardIndex === undefined || !$progressNavData.items[cardIndex]) return;
    $progressNavData.items[cardIndex].icon = {
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
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <button
    class="close"
    title="Close"
    on:click={() => {
      progressNav.deselectAll();
    }}
  >
    <i class="icon-end" />
  </button>
  <ItemPages
    bind:items={$progressNavData.items}
    bind:selectedId
    OrderableListOptions={{
      canDelete: false,
      canReorder: false,
      actions(item) {
        return [
          {
            title: item.hide ? "Show" : "Hide",
            icon: item.hide ? "icon-solid icon-eye" : "icon-line icon-eye",
            event: () => {
              item.hide = !item.hide;
            },
          },
        ];
      },
    }}
    idKey="moduleID"
    let:itemIndex
  >
    <svelte:fragment slot="header">
      <!-- <ButtonRadio
      title="Row Size"
      choices={ValidSizes}
      labels={Object.keys(ProgressNavSize)}
      bind:value={$progressNavData.size}
    /> -->
      <ColourPicker
        label="Progress Bar Colour"
        id={nanoid() + "-setting-background"}
        bind:colour={$progressNavData.color}
        contrastColour={colord("#ffffff")}
        showNone={false}
        asModal={isModal}
      />
    </svelte:fragment>
    <div class="card-slot">
      {#key itemIndex}
        <div
          class="card"
          out:fade={{ duration: 150 }}
          in:fade={{ duration: 150, delay: 200 }}
        >
          {#if itemIndex >= 0}
            <div class="card-header">
              <h3 class="card-title">
                {$progressNavData.items[itemIndex].label}
              </h3>
            </div>
            <div class="card-body">
              <button
                class="ProgressNav"
                on:click={() => {
                  iconPicker.open();
                }}>Select Icon</button
              >
            </div>
          {:else}
            <div class="card-body">
              <p>Select an item on the left to edit it.</p>
            </div>
          {/if}
        </div>
      {/key}
    </div>
  </ItemPages>
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
  .card-slot {
    /* To make the fade transition overlay on itself */
    @apply relative grid grow;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    grid-template-areas: "card";
  }
  .card {
    @apply flex flex-col items-start gap-2 border border-gray-300 rounded shadow-sm grow;
    grid-area: card;
    .card-header {
      @apply bg-gray-100 rounded-t border-b w-full px-2 py-1;
      h3 {
        @apply text-base m-0;
      }
    }
    .card-body {
      @apply p-2 w-full;
    }
    p {
      @apply text-sm text-gray-500 italic text-center;
    }
  }
</style>
