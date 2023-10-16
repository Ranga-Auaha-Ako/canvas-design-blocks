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
    getIcon,
  } from "./search";
  import ImageList from "./imageList.svelte";
  import { nanoid } from "nanoid";
  import ScrollContainer from "../scrollContainer.svelte";
  import { persisted } from "svelte-persisted-store";
  import type { Writable } from "svelte/store";

  export const linkType: Writable<InternalLinks | undefined> = persisted(
    "cdb-contentsearch-linktype",
    undefined
  );
  export let filter: FitlerTypes | undefined = undefined;

  let query = "";
  let debounce: number | undefined;

  function isImage(files: any[]): files is Image[] {
    return $linkType === InternalLinks.File && filter === FitlerTypes.Images;
  }

  const dispatch = createEventDispatcher<{
    select: typeof $linkType extends InternalLinks.File
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

  $: results = searchContent($linkType, query, filter);

  let searchInput: HTMLInputElement;

  let internal$LinkTypesList = Object.values(InternalLinks);

  let scrollCont: ScrollContainer;
  $: results.then(() => {
    scrollCont.update();
  });
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
  <ScrollContainer bind:this={scrollCont} card={false}>
    <div class="fileResults">
      {#each internal$LinkTypesList as type}
        {@const id = nanoid()}
        <button
          class="accordion-header"
          class:active={type === $linkType}
          id="{id}-header"
          aria-expanded={type === $linkType}
          aria-controls={id}
          on:click={() => {
            if (type === $linkType) $linkType = undefined;
            else $linkType = type;
          }}
        >
          <i
            class="icon-Solid"
            class:icon-arrow-open-down={$linkType !== type}
            class:icon-arrow-open-up={$linkType === type}
          />
          <span>
            {type}
          </span>
        </button>
        <div class="fileList" {id} role="region" aria-labelledby="{id}-header">
          {#if type === $linkType}
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
                      class:unpublished={!file.published}
                      on:click={() => {
                        dispatch("select", file);
                      }}
                    >
                      <i class="icon-Line icon-{getIcon(file)}" />
                      <span class="linkName">{file.name}</span>
                      <div class="publishedStatus">
                        {#if file.published === false}
                          <i
                            class="icon-Solid icon-unpublish"
                            title="Unpublished"
                          />
                        {:else if file.published === true}
                          <i
                            class="icon-Solid icon-publish"
                            title="Published"
                          />
                        {/if}
                      </div>
                    </button>
                    <hr />
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
  </ScrollContainer>
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

  .fileResults {
    /*  */
  }

  .accordion-header {
    @apply w-full p-2 px-3 text-left align-middle leading-none transition;
    @apply text-lg font-bold border-b;
    i {
      @apply mr-3;
    }
    &.active {
      /* @apply border-gray-300 border border-b-0 rounded-t; */
    }
  }

  .fileListResults {
    @apply grid grid-cols-1 text-black py-1;
    & hr {
      @apply m-0 p-0 mx-2;
    }
    & > button {
      @apply w-full text-left p-2 px-3 transition ring-0 relative z-10 rounded;
      @apply flex flex-row items-center gap-2 text-base;
      i {
        @apply text-green-700 mr-1;
        &:before {
          @apply text-lg leading-none;
        }
      }
      .linkName {
        @apply block truncate will-change-transform transform transition-transform grow;
      }
      &.unpublished {
        @apply text-black;
        i {
          @apply text-black;
        }
      }
      &:hover {
        @apply ring-1 ring-primary bg-gray-100;
        .linkName {
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
