<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { createEventDispatcher } from "svelte";
  import Portal from "svelte-portal/src/Portal.svelte";
  import { fade, slide } from "svelte/transition";
  import { filesize } from "filesize";
  import mock from "./mock";
  import {
    FitlerTypes,
    InternalLinks,
    searchContent,
    Image,
    Link,
    File,
  } from "./search";
  import ImageList from "./imageList.svelte";
  import { nanoid } from "nanoid";

  export let linkType: InternalLinks | undefined = undefined;
  export let filter: FitlerTypes | undefined = undefined;

  let query = "";
  let debounce: number | undefined;

  function isImage(files: any[]): files is Image[] {
    return linkType === InternalLinks.File && filter === FitlerTypes.Images;
  }

  const dispatch = createEventDispatcher<{
    select: typeof linkType extends InternalLinks.File
      ? typeof filter extends FitlerTypes.Images
        ? Image
        : File
      : Link;
  }>();

  const setQuery = (value: string) => {
    if (debounce !== undefined) clearTimeout(debounce);
    debounce = window.setTimeout(() => {
      if (value.length > 2) query = value;
      else query = "";
    }, 200);
  };

  $: results = searchContent(linkType, query, filter);

  let searchInput: HTMLInputElement;

  let internalLinkTypesList = Object.values(InternalLinks);
</script>

<div class="wrapper cgb-component">
  <div class="searchFilter">
    <input
      type="search"
      class="itemSearch"
      placeholder="Search for a link"
      bind:this={searchInput}
      on:input={(e) => setQuery(e.currentTarget.value)}
    />
  </div>
  <div class="fileResults">
    {#each internalLinkTypesList as type}
      {@const id = nanoid()}
      <h4>
        <button
          class="accordion-header"
          id="{id}-header"
          aria-expanded={type === linkType}
          aria-controls={id}
          on:click={() => {
            if (type === linkType) linkType = undefined;
            else linkType = type;
          }}
        >
          <i
            class="icon-Solid"
            class:icon-arrow-open-down={linkType !== type}
            class:icon-arrow-open-up={linkType === type}
          />
          <span>
            {type}
          </span>
        </button>
      </h4>
      <div class="fileList" {id} role="region" aria-labelledby="{id}-header">
        {#if type === linkType}
          {#await results}
            <div class="fileListResults">
              <div class="status-msg" in:fade|global>
                <p>Loading...</p>
              </div>
            </div>
          {:then files}
            <div class="fileListResults">
              {#if files.length === 0}
                <div class="status-msg" in:fade|global>
                  <p>No results found</p>
                  {#if query.length > 2}
                    <button
                      class="btn btn-secondary"
                      on:click|stopPropagation={() => {
                        query = "";
                        searchInput.value = "";
                      }}>Clear Search</button
                    >
                  {/if}
                </div>
              {:else if isImage(files)}
                <ImageList {files} on:select />
              {:else}
                {#each files as file}
                  <button
                    on:click={() => {
                      dispatch("select", file);
                    }}
                  >
                    <span class="filename">{file.name}</span>
                  </button>
                {/each}
              {/if}
            </div>
          {:catch error}
            <div class="status-msg">
              <strong>An error occured</strong>
              <p>{error.message}</p>
            </div>
          {/await}
        {/if}
      </div>
    {/each}
  </div>
</div>

<style lang="postcss">
  .wrapper {
    @apply flex flex-col gap-2;
    z-index: 120;
  }

  .searchFilter {
    @apply flex gap-1 mb-2;
    input[type="search"] {
      @apply w-full p-3 border border-solid border-gray-200;
      &:focus {
        @apply outline-none border-primary;
      }
    }
  }

  .accordion-header {
    @apply w-full p-2 px-3 text-left align-middle leading-none text-lg;
    i {
      @apply mr-2;
    }
  }

  .fileListResults {
    @apply grid grid-cols-1 gap-2 bg-gray-100 text-black rounded border border-gray-300 overflow-clip py-1;
    & > button {
      @apply w-full text-left p-2 px-3 transition ring-0;
      span {
        @apply block truncate will-change-transform transform transition-transform;
      }
      &:hover {
        @apply ring-1 ring-primary bg-white;
        span {
          @apply translate-x-1;
        }
      }
    }
  }
  .status-msg {
    @apply flex flex-col items-center justify-center gap-2;
    p {
      @apply text-gray-500;
    }
    button {
      @apply text-sm;
    }
  }
</style>
