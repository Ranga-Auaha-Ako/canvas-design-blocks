<script lang="ts">
  import { ButtonBar, ButtonBarSize, ValidSizes } from "../buttonBar";
  import { fade } from "svelte/transition";
  import ButtonRadio from "$lib/util/components/buttonRadio.svelte";
  import { nanoid } from "nanoid";
  import IconPicker from "$lib/util/components/iconSearch/iconPicker.svelte";
  import ColourPicker from "$lib/util/components/colourPicker.svelte";
  import { colord } from "colord";
  import LinkInput from "$lib/util/components/contentSearch/linkEditor/linkInput.svelte";
  import { createEventDispatcher, onDestroy } from "svelte";
  import OrderableList from "$lib/util/components/orderableList.svelte";
  import { Writable } from "svelte/store";
  import { LocalState } from "$lib/elements/imageCard/imageCard";
  import ItemPages from "$lib/util/components/itemPages/itemPages.svelte";

  export let props: {
    buttonBar: ButtonBar;
  };

  export let isModal: boolean = false;
  let selectedId: string | undefined = undefined;
  $: buttonBar = props.buttonBar;
  $: buttonBarData = buttonBar.SvelteState;
  $: cardIndex =
    selectedId !== undefined
      ? ButtonBar.getItemIndex($buttonBarData, selectedId)
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
    if (cardIndex === undefined || !$buttonBarData.items[cardIndex]) return;
    $buttonBarData.items[cardIndex].icon = {
      id: detail.icon.id,
      type: detail.type,
    };
  });
  onDestroy(() => {
    iconPicker.$destroy();
  });

  function addItem() {
    $buttonBarData.items.push({
      moduleID: nanoid(),
      label: "New Item",
      url: "#",
      icon: undefined,
    });
    selectedId = $buttonBarData.items[$buttonBarData.items.length - 1].moduleID;
    $buttonBarData.items = $buttonBarData.items;
  }

  let isLoading: boolean = false;
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
      buttonBar.deselectAll();
    }}
  >
    <i class="icon-end" />
  </button>
  <ItemPages
    bind:items={$buttonBarData.items}
    bind:selectedId
    OrderableListOptions={{
      canDelete: false,
      canReorder: true,
      canDeselect: true,
    }}
    idKey="moduleID"
    let:itemIndex
  >
    <svelte:fragment slot="header">
      <!-- <ButtonRadio
      title="Row Size"
      choices={ValidSizes}
      labels={Object.keys(ButtonBarSize)}
      bind:value={$buttonBarData.size}
    /> -->
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
              <h3 class="card-title truncate">
                {$buttonBarData.items[itemIndex].label}
              </h3>
              <button
                class="btn btn-text btn-small shrink-0"
                on:click={() => {
                  selectedId = undefined;
                }}
              >
                Done
                <i class="icon icon-check" />
              </button>
            </div>
            <div class="card-body">
              <!-- Input for label -->
              <div class="form-group">
                <label for={nanoid() + "-setting-label"}>Label</label>
                <input
                  type="text"
                  id={nanoid() + "-setting-label"}
                  bind:value={$buttonBarData.items[itemIndex].label}
                />
              </div>
              <!-- Input for URL -->
              <div class="form-group">
                <label for={nanoid() + "-setting-url"}>URL</label>
                <LinkInput
                  id={nanoid() + "-setting-url"}
                  link={$buttonBarData.items[itemIndex].url}
                  on:save={(e) => {
                    $buttonBarData.items[itemIndex].url = e.detail.link;
                  }}
                />
              </div>
              <button
                class="btn btn-secondary"
                on:click={() => {
                  iconPicker.open();
                }}>Select Icon</button
              >
              <div class="text-right">
                <button
                  class="btn btn-danger btn-small"
                  on:click={() => {
                    $buttonBarData.items = $buttonBarData.items.filter(
                      (i, idx) => idx !== itemIndex
                    );
                  }}
                >
                  <i class="icon icon-trash" />
                  Delete
                </button>
              </div>
            </div>
          {:else}
            <div class="card-body">
              <h3>Button Bar</h3>
              <p>
                Help people quickly navigate between pages and content that
                shows one after the other.
              </p>
              <div class="flex flex-row gap-2 flex-wrap mt-2">
                <button
                  class="btn btn-primary btn-small block mt-0 grow"
                  on:click={async () => {
                    isLoading = true;
                    await ButtonBar.syncModules(buttonBarData);
                    isLoading = false;
                  }}
                  disabled={isLoading}
                >
                  <i
                    class="icon icon-progress"
                    class:motion-safe:animate-spin={isLoading}
                  />
                  Sync to Modules
                </button>
                <button
                  class="btn btn-primary btn-small block mt-0 grow"
                  on:click={() => {
                    addItem();
                  }}
                >
                  <i class="icon icon-add" />
                  Add new item</button
                >
              </div>
              <p>Adjust the progress of this page through the items here:</p>
              <input
                class="w-full progress-selector"
                type="range"
                min="-1"
                max={$buttonBarData.items.length - 1}
                step="1"
                bind:value={$buttonBarData.position}
              />

              <ColourPicker
                label="Button Bar Colour"
                id={nanoid() + "-setting-background"}
                bind:colour={$buttonBarData.color}
                contrastColour={colord("#ffffff")}
                style="wide"
                showNone={false}
                asModal={isModal}
              />
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
    @apply grid grid-cols-1 max-w-lg w-screen gap-2;
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
    /* @apply relative grid grow;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    grid-template-areas: "card"; */
    @apply grid;
  }
  .card {
    @apply flex flex-col items-start gap-2 border border-gray-300 rounded shadow-sm grow;
    grid-column-start: 1;
    grid-column-end: 2;
    grid-row-start: 1;
    grid-row-end: 2;
    .card-header {
      @apply bg-gray-100 rounded-t border-b w-full px-2 py-1 grid gap-2 justify-between items-center;
      grid-template-columns: 1fr auto;
      h3 {
        @apply text-base m-0;
      }
    }
    .card-body {
      @apply p-2 w-full;
      h3 {
        @apply text-lg m-0;
      }
      p {
        @apply text-sm m-0 mt-2;
      }
      .progress-selector {
        @apply accent-primary;
      }
    }
  }
</style>
