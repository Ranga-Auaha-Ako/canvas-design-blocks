<script lang="ts">
  import { debounce } from "perfect-debounce";
  import IconPicker, { IconPickerOptions, IconType } from "./iconPicker";
  import { createEventDispatcher } from "svelte";
  import { IconState } from "./iconElement.svelte";
  import ColourPicker from "../colourPicker.svelte";
  import { nanoid } from "nanoid";
  import { colord } from "colord";
  import { persisted as localStorageWritable } from "svelte-local-storage-store";

  const dispatch = createEventDispatcher();
  const selectIcon = (icon: IconState) => {
    dispatch("selectIcon", icon);
  };

  export let iconPicker: IconPicker;
  export let options: IconPickerOptions;

  let iconPickerFrame: HTMLIFrameElement;

  let filterQuery = "";
  let iconType = IconType.Line;
  let iconColor = localStorageWritable(
    "cdb-preferences-iconColor",
    colord("#000000"),
    {
      serializer: {
        stringify: (value) => value.toHex(),
        parse: (value) => colord(value),
      },
    }
  );
  let results = iconPicker.choices;
  const filterIcons = debounce(
    (query: string) => {
      resultsWrapperScroll = resultsWrapperScroll; // Bump to force refresh of scroll hint indicator
      if (query.length < 3) results = iconPicker.choices;
      results = new Map(
        [...iconPicker.choices].filter(
          ([key, value]) =>
            key.toLowerCase().includes(query.toLowerCase()) && iconType in value
        )
      );
    },
    50,
    { trailing: true }
  );
  $: filterIcons(filterQuery);

  let resultsWrapper: HTMLDivElement;
  let resultsList: HTMLDivElement;
  let resultsWrapperScroll: number = 0;
  $: scrollDistance =
    (resultsList?.scrollHeight || 0) -
    resultsWrapperScroll -
    (resultsWrapper?.clientHeight || 0 + 10);
  $: results,
    setTimeout(() => {
      scrollDistance =
        (resultsList?.scrollHeight || 0) -
        resultsWrapperScroll -
        (resultsWrapper?.clientHeight || 0 + 10);
    }, 50);
</script>

<div class="modal-wrap">
  <div class="searchFilter">
    <input
      type="search"
      placeholder="Search for an image"
      bind:value={filterQuery}
    />
    <button
      class="toggle-icons"
      title="Toggle Line/Solid Icons"
      on:click={() => {
        iconType = iconType === IconType.Line ? IconType.Solid : IconType.Line;
      }}
    >
      <i
        class="icon-{iconType === IconType.Solid ? 'Solid' : 'Line'} icon-paint"
      />
      {iconType === IconType.Solid ? "Solid" : "Line"}
    </button>
    {#if options.editColor}
      <div class="colourPicker">
        <ColourPicker
          label="Icon Colour"
          id={nanoid() + "-setting-background"}
          bind:colour={$iconColor}
          contrastColour={colord("#ffffff")}
          popupDirection={"top"}
          zIndex={12000}
          showNone={false}
        />
      </div>
    {/if}
  </div>
  <div class="overflow" class:active={scrollDistance > 0}>
    <div
      class="search-container"
      bind:this={resultsWrapper}
      on:scroll={() => {
        resultsWrapperScroll = resultsWrapper.scrollTop;
      }}
    >
      <div
        class="results iconList"
        bind:this={resultsList}
        style:color={$iconColor.toHex()}
      >
        {#each results.entries() as [name, urls] (name)}
          <button
            class="icon"
            title={name}
            on:click={() => {
              if (options.editColor) {
                selectIcon({
                  class: name,
                  url: urls[iconType],
                  type: iconType,
                  color: $iconColor.toHex(),
                });
              } else {
                selectIcon({
                  class: name,
                  url: urls[iconType],
                  type: iconType,
                });
              }
            }}
          >
            <i
              class="icon-{iconType === IconType.Solid
                ? 'Solid'
                : 'Line'} icon-{name}"
            />
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>

<style lang="postcss">
  .searchFilter {
    @apply flex gap-1 mb-2;
    input[type="search"] {
      @apply w-full p-3 border border-solid border-gray-200;
      &:focus {
        @apply outline-none border-primary;
      }
    }
    button.toggle-icons {
      @apply p-3 leading-4 rounded text-white bg-primary shrink-0 cursor-pointer transition;
      &:hover {
        @apply bg-slate-800;
      }
      &:focus {
        @apply ring-2;
      }
    }
    .colourPicker {
      @apply shrink-0 flex items-center pl-3;
    }
  }

  .overflow {
    @apply relative rounded overflow-clip shadow;
    &:after {
      @apply absolute h-4 bg-gradient-to-t from-gray-500 pointer-events-none;
      @apply bottom-0 left-0 w-full;
      @apply opacity-0 transition-opacity;
      content: " ";
    }
    &.active:after {
      @apply opacity-20;
    }
  }
  .search-container {
    @apply overflow-y-auto relative p-2;
    max-height: calc(650px - 9rem);
  }
  .iconList {
    @apply grid gap-1;
    grid-template-columns: repeat(auto-fill, minmax(2rem, 1fr));
    .icon {
      @apply rounded border-gray-100 border border-solid bg-white text-center p-2 cursor-pointer;
      @apply transition duration-200 ease-in-out relative z-0;
      &:hover {
        @apply scale-125 z-10 shadow border-transparent;
      }
      i {
        @apply text-2xl leading-4 block;
      }
    }
  }
  .iconPickerFrame {
    @apply w-full;
    height: 80vh;
  }
</style>
