<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade, slide } from "svelte/transition";
  import { filesize } from "filesize";
  import { FileSearch, FitlerTypes, mockData } from "../search";
  let debounce: number | undefined;
  import { LightPaginationNav } from "svelte-paginate";

  const setQuery = (value: string) => {
    if (debounce !== undefined) clearTimeout(debounce);
    debounce = window.setTimeout(() => {
      if (value.length > 2) $imageQuery = value;
      else $imageQuery = "";
    }, 200);
  };

  const shouldMock = window.location.hostname === "localhost";
  const results = shouldMock
    ? mockData
    : new FileSearch("", FitlerTypes.Images);
  let imageQuery = results.query;
  let imageResults = results.data;
  $: resultTotal = results.total;
  $: resultPage = results.page;
  $: resultPerPage = results.perPage;

  const dispatch = createEventDispatcher();

  let searchInput: HTMLInputElement;

  const truncate = (str: string, n: number) => {
    return str.length > n ? str.substr(0, n - 1) + "..." : str;
  };
</script>

<div class="wrapper cgb-component">
  <input
    type="search"
    class="imageSearch"
    placeholder="Search for an image"
    bind:this={searchInput}
    on:input={(e) => setQuery(e.currentTarget.value)}
  />
  <div class="imageResults">
    {#await $imageResults}
      <div class="status-msg">
        <p>Loading...</p>
      </div>
    {:then files}
      {#if files.length === 0}
        <div class="status-msg">
          <p>No results found</p>
          <button
            class="tox-button tox-button--secondary"
            on:click={() => {
              $imageQuery = "";
              searchInput.value = "";
            }}>Clear Search</button
          >
        </div>
      {:else}
        {#each files as file}
          <div class="imageResult" in:fade|global>
            <button
              class="imageChoice"
              on:click={() => dispatch("selectImage", file.image)}
            >
              <img src={file.thumbnail_url} alt={file.display_name} />
            </button>
            <div class="caption">
              <div class="filename">
                {truncate(file.display_name, 20)}
              </div>
              <div class="filesize">
                {filesize(file.size)}
              </div>
              <div class="date-created">
                {new Date(file.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        {/each}
      {/if}
    {:catch error}
      <div class="status-msg">
        <strong>An error occured</strong>
        <p>{error.message}</p>
      </div>
    {/await}
  </div>

  {#await $resultTotal then total}
    {#if total && $resultPerPage}
      <LightPaginationNav
        totalItems={total}
        pageSize={$resultPerPage}
        currentPage={$resultPage}
        limit={1}
        showStepOptions={true}
        on:setPage={(e) => ($resultPage = e.detail.page)}
      />
    {/if}
  {/await}
</div>

<style lang="postcss">
  .wrapper {
    @apply flex flex-col gap-2;
    z-index: 120;
  }

  .imageSearch {
    @apply w-full box-border py-2 px-2 m-0 border border-gray-300 border-solid;
    &:hover {
      @apply ring-2;
    }
  }
  .imageResults {
    @apply grid grid-cols-4 gap-2 content-baseline;
    aspect-ratio: 4 / 3;
    .status-msg {
      @apply col-span-full row-span-full flex flex-col items-center justify-center;
      p {
        @apply text-center;
      }
    }
  }
  .imageResult {
    @apply relative;
    button.imageChoice {
      @apply w-full aspect-square;
      @apply bg-center rounded shadow border-0;
      @apply transition-all duration-300;
      @apply cursor-pointer;
      background-position:
        0px 0px,
        10px 10px;
      background-size: 20px 20px;
      background-image: linear-gradient(
          45deg,
          #ddd 25%,
          transparent 25%,
          transparent 75%,
          #ddd 75%,
          #ddd 100%
        ),
        linear-gradient(
          45deg,
          #ddd 25%,
          white 25%,
          white 75%,
          #ddd 75%,
          #ddd 100%
        );
      &:hover {
        @apply scale-105;
        &:before {
          @apply hidden;
        }
      }
      &:focus,
      &:active {
        @apply ring-2 ring-blue-500 scale-95 opacity-80;
      }
      img {
        @apply w-full h-full object-cover rounded absolute inset-0;
      }
    }
    .caption {
      @apply opacity-0 transition-opacity duration-300 absolute inset-0 flex-col flex items-center justify-center;
      @apply bg-white bg-opacity-75 rounded w-full h-full m-0 pointer-events-none overflow-hidden;
      @apply text-center text-sm break-words;
      .filename {
        @apply font-bold w-full;
      }
      .filesize {
        @apply text-xs w-full;
      }
    }
    &:hover .caption,
    &:focus-within .caption {
      @apply opacity-100;
    }
  }
</style>
