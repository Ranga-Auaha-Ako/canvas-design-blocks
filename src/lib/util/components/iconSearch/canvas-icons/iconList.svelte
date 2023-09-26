<script lang="ts">
  import { debounce } from "perfect-debounce";
  import IconPicker, { IconPickerOptions, IconType } from "../iconPicker";
  import { createEventDispatcher } from "svelte";
  import ColourPicker from "../../colourPicker.svelte";
  import { nanoid } from "nanoid";
  import { colord } from "colord";
  import { persisted as localStorageWritable } from "svelte-local-storage-store";
  import {
    customCategory,
    customIcon,
    getIconClass,
    instCategory,
    instIcon,
    isCustomCategory,
    isInstCategory,
  } from "../canvas-icons/icons";

  import { iconData } from "./icons";

  const dispatch = createEventDispatcher<{
    selectIcon: {
      icon: instIcon | customIcon;
      color?: string;
      type: IconType;
    };
  }>();
  const selectIcon = (data: {
    icon: instIcon | customIcon;
    color?: string;
    type: IconType;
  }) => {
    dispatch("selectIcon", data);
  };

  export let icons: iconData;
  export let options: IconPickerOptions;
  let filterQuery = "";
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
  let results = icons;
  const filterIcons = debounce(
    (query: string) => {
      resultsWrapperScroll = resultsWrapperScroll; // Bump to force refresh of scroll hint indicator
      if (query.length < 3) results = icons;
      results = icons
        .map((cat) => {
          return {
            name: cat.name,
            type: cat.type,
            icons: cat.icons.filter((icon: instIcon | customIcon) => {
              const q = query.toLowerCase();
              const isInTerm = icon.term?.toLowerCase().includes(q);
              const isInTags =
                "tags" in icon
                  ? icon.tags.some((tag) => tag.toLowerCase().includes(q))
                  : false;
              const isInCollection =
                "collections" in icon
                  ? icon.collections.some((collection) =>
                      collection.toLowerCase().includes(q)
                    )
                  : false;
              return isInTerm || isInTags || isInCollection;
            }),
          } as instCategory | customCategory;
        })
        .filter((cat) => cat.icons.length);
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

<div class="searchFilter">
  <input
    type="search"
    placeholder="Search for an image"
    bind:value={filterQuery}
  />
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
    <div class="categories" bind:this={resultsList}>
      {#each results as category}
        <div class="category">
          <h3>{category.name}</h3>
          <div class="iconList">
            {#each category.icons as icon (icon.id)}
              <button
                class="icon"
                title={icon.term}
                on:click={() => {
                  if (options.editColor) {
                    selectIcon({
                      icon,
                      color: $iconColor.toHex(),
                      type: category.type,
                    });
                  } else {
                    selectIcon({
                      icon,
                      type: category.type,
                    });
                  }
                }}
              >
                {#if isCustomCategory(category)}
                  <img
                    src="https://{import.meta.env
                      .CANVAS_BLOCKS_USE_CANVAS_ICONS}/font/stack/svg/sprite.stack.svg#{getIconClass(
                      icon.url
                    )}"
                    alt={icon.term}
                  />
                {:else if isInstCategory(category)}
                  <i
                    class="icon-{category.type === IconType.Solid
                      ? 'Solid'
                      : 'Line'} icon-{icon.term}"
                  />
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {/each}
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
  .categories {
    @apply grid grid-flow-row gap-2;
    .category {
      @apply flex flex-col gap-2;
      h3 {
        @apply text-lg font-bold w-full text-black;
      }
    }
  }
  .iconList {
    @apply grid gap-1;
    grid-template-columns: repeat(auto-fill, minmax(3rem, 1fr));
    .icon {
      @apply rounded border-gray-100 border border-solid bg-white text-center p-2 cursor-pointer;
      @apply transition duration-200 ease-in-out relative z-0 aspect-square overflow-hidden;
      &:hover {
        @apply scale-125 z-10 shadow border-transparent;
      }
      &:focus {
        @apply ring-2;
      }
      i {
        @apply block;
        &:before {
          font-size: 1.75rem;
        }
      }
    }
  }
  .iconPickerFrame {
    @apply w-full;
    height: 80vh;
  }
</style>
