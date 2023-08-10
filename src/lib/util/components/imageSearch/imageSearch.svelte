<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { createEventDispatcher } from "svelte";
  import Portal from "svelte-portal/src/Portal.svelte";
  import { fade, slide } from "svelte/transition";
  import { filesize } from "filesize";
  import mock from "./mock";
  let imageQuery = "";
  let debounce: number | undefined;

  const setQuery = (value: string) => {
    if (debounce !== undefined) clearTimeout(debounce);
    debounce = window.setTimeout(() => {
      if (value.length > 2) imageQuery = value;
      else imageQuery = "";
    }, 200);
  };
  const COURSE_ID = window.ENV?.COURSE_ID;
  const searchFiles = async (query: string | undefined = undefined) => {
    if (import.meta.env.DEV && window.location.hostname === "localhost") {
      // Mock data
      return mock.filter((item) => {
        return query
          ? item.display_name.toLowerCase().includes(query.toLowerCase())
          : true;
      });
    }
    if (!COURSE_ID) return [];
    const url = `/api/v1/courses/${COURSE_ID}/files?content_types=image&sort=created_at&order=desc${
      query ? `&search_term=${query}` : ""
    }&per_page=12&limit=12`;
    const response = await fetch(url);
    const files = await response.json();
    return files;
  };

  $: results = searchFiles(imageQuery);

  const dispatch = createEventDispatcher();
  const getFileURL = (file: any) => {
    if (import.meta.env.DEV && window.location.hostname === "localhost") {
      return `https://canvas.auckland.ac.nz/courses/77467/files/${file.id}/preview`;
    }
    return `/courses/${COURSE_ID}/files/${file.id}/preview`;
  };

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
    {#await results}
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
              imageQuery = "";
              searchInput.value = "";
            }}>Clear Search</button
          >
        </div>
      {:else}
        {#each files as file}
          <div class="imageResult" in:fade|global>
            <button
              class="imageChoice"
              on:click={() => dispatch("selectImage", getFileURL(file))}
              style:--image-url={`url(${file.thumbnail_url})`}
            />
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
      @apply bg-cover bg-center rounded shadow border-0;
      @apply transition-all duration-300;
      @apply cursor-pointer;
      background-image: var(--image-url);
      &:hover {
        @apply scale-105;
      }
      &:focus,
      &:active {
        @apply ring-2 ring-blue-500 scale-95 opacity-80;
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
