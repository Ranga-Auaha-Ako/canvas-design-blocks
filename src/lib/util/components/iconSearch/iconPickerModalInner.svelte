<script lang="ts">
  import { debounce } from "perfect-debounce";
  import IconPicker from "./iconPicker";
  import { fade } from "svelte/transition";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
  const selectIcon = (icon: string) => {
    dispatch("selectIcon", icon);
  };

  export let iconPicker: IconPicker;

  let iconPickerFrame: HTMLIFrameElement;

  const iconHost = import.meta.env.CANVAS_BLOCKS_ICONS_HOST;
  const usesCanvasIcons = __USES_CANVAS_ICONS__;

  let filterQuery = "";
  let results = iconPicker.choices;
  console.log("!!!!!", results);
  const filterIcons = debounce(
    (query: string) => {
      resultsWrapperScroll = resultsWrapperScroll; // Bump to force refresh of scroll hint indicator
      if (query.length < 3) results = iconPicker.choices;
      results = iconPicker.choices.map((category) => {
        const { name, icons } = category;
        return {
          name,
          icons: icons.filter((icon) => {
            return icon.includes(query);
          }),
        };
      });
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

{#if usesCanvasIcons}
  <iframe
    class="iconPickerFrame"
    src="https://{iconHost}/"
    frameborder="0"
    title="Canvas Icons"
    bind:this={iconPickerFrame}
  />
{:else}
  <input
    type="search"
    class="imageSearch"
    placeholder="Search for an image"
    bind:value={filterQuery}
  />
  <div class="overflow" class:active={scrollDistance > 0}>
    <div
      class="search-container"
      bind:this={resultsWrapper}
      on:scroll={() => {
        resultsWrapperScroll = resultsWrapper.scrollTop;
      }}
    >
      <div class="results" bind:this={resultsList}>
        {#each results as category}
          <h4>{category.name}</h4>
          <div class="iconList">
            {#each category.icons as choice}
              {#key choice}
                <button
                  class="icon"
                  title={choice}
                  on:click={() => {
                    selectIcon(`icon-${category.name} icon-${choice}`);
                  }}
                >
                  <i class="icon-{category.name} icon-{choice}" />
                </button>
              {/key}
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style lang="postcss">
  input[type="search"] {
    @apply w-full p-3 border border-solid border-gray-200;
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
    max-height: 50vh;
  }
  .results {
    h4 {
      @apply text-lg font-bold mx-2 border-b border-solid border-gray-200 mb-2;
    }
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
