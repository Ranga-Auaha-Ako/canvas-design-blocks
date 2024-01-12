<script lang="ts">
  import { debounce } from "perfect-debounce";
  import { IconPickerOptions, IconType, category, icon } from "../iconPicker";
  import { createEventDispatcher } from "svelte";
  import ColourPicker from "$lib/util/components/colourPicker.svelte";
  import { nanoid } from "nanoid";
  import { colord } from "colord";
  import { persisted as localStorageWritable } from "svelte-persisted-store";
  import {
    customCategory,
    customIcon,
    getIconClass,
    instCategory,
    instIcon,
    isCustomCategory,
    isInstCategory,
  } from "./icons";

  import { iconData } from "./icons";
  import ScrollContainer from "$lib/util/components/scrollContainer.svelte";
  import { slide } from "svelte/transition";

  const dispatch = createEventDispatcher<{
    selectIcon: {
      icon: icon;
      color?: string;
      type: IconType.Custom;
    };
    colorChange: { color: string };
  }>();
  const selectIcon = (data: { icon: icon; color?: string }) => {
    dispatch("selectIcon", { ...data, type: IconType.Custom });
  };

  export let icons: category[];
  export let options: IconPickerOptions;
  export let asModal: boolean = false;
  let filterQuery = "";
  let iconColor = localStorageWritable(
    "cdb-preferences-iconColor",
    colord("#000000"),
    {
      serializer: {
        stringify: (value) => (value ? value.toHex() : ""),
        parse: (value) => colord(value),
      },
    }
  );
  $: dispatch("colorChange", { color: $iconColor.toHex() });
  let results = icons;
  const filterIcons = debounce(
    (query: string) => {
      scroller?.update();
      if (query.length < 3) results = icons;
      results = icons
        .map((cat) => {
          return {
            name: cat.name,
            icons: cat.icons.filter((icon) => {
              const q = query.toLowerCase();
              const isInName = icon.n?.toLowerCase().includes(q);
              const isInTags = icon.s.some((tag) =>
                tag.toLowerCase().includes(q)
              );
              return isInName || isInTags;
            }),
          };
        })
        .filter((cat) => cat.icons.length);
    },
    50,
    { trailing: true }
  );
  $: filterIcons(filterQuery);

  let scroller: ScrollContainer;
  $: results, scroller?.update();

  $: contrastLevel = $iconColor.contrast(colord("#ffffff"));
  $: isReadable = contrastLevel && contrastLevel >= 7;
</script>

<div class="searchFilter">
  <input
    type="search"
    placeholder="Search for an icon"
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
        {asModal}
      />
    </div>
  {/if}
</div>
{#if !isReadable}
  <div class="colour-alert" transition:slide|global>
    <p class="alert-details">
      <span class="font-bold">Warning:</span> Text and icons smaller than 18pt (or
      bold 14pt) should display a minimum contrast ratio of 4.5:1. Consider using
      a darker colour if you are using this icon in a smaller size.
    </p>
  </div>
{/if}
<ScrollContainer
  bind:this={scroller}
  maxHeight={options.maxHeight}
  card={options.card === undefined ? true : options.card}
>
  <div
    class="categories"
    style:color={options.editColor ? $iconColor.toHex() : "black"}
  >
    {#each results as category}
      <div class="category">
        <h3>{category.name}</h3>
        <div class="iconList">
          {#each category.icons as icon (icon.i)}
            <button
              class="icon"
              title={icon.n}
              on:click={() => {
                if (options.editColor) {
                  selectIcon({
                    icon,
                    color: $iconColor.toHex(),
                  });
                } else {
                  selectIcon({
                    icon,
                  });
                }
              }}
            >
              <span class="cdb--icon">
                {category.name}.{icon.l}
              </span>
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</ScrollContainer>

<style lang="postcss">
  .searchFilter {
    @apply flex gap-1 mb-2;
    input[type="search"] {
      @apply w-full p-3 border border-solid border-gray-200;
      &:focus {
        @apply outline-none border-primary;
      }
    }
    .colourPicker {
      @apply shrink-0 flex items-center pl-3;
    }
  }

  .colour-alert {
    @apply mb-2 border-l-4 border-orange-300 bg-orange-100 text-orange-900 p-2 rounded transition text-xs;
    p {
      @apply m-0;
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
        @apply text-lg font-bold w-full text-black mt-0;
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
      span {
        @apply block;
        font-size: 1.75rem;
      }
    }
  }
  .iconPickerFrame {
    @apply w-full;
    height: 80vh;
  }
</style>
