<script lang="ts">
  import { fade } from "svelte/transition";
  import { type Image } from "./search";
  import { createEventDispatcher } from "svelte";
  import { filesize } from "filesize";
  export let files: Image[];

  const dispatch = createEventDispatcher<{ select: Image }>();

  const truncate = (str: string, n: number) => {
    return str.length > n ? str.substr(0, n - 1) + "..." : str;
  };
</script>

<div class="imageResults">
  {#each files as file}
    <div class="imageResult" in:fade|global>
      <button class="imageChoice" on:click={() => dispatch("select", file)}>
        <img src={file.thumbnail_url} alt={file.name} />
      </button>
      <div class="caption">
        <div class="filename">
          {truncate(file.name, 20)}
        </div>
        <div class="filesize">
          {filesize(file.size)}
        </div>
      </div>
    </div>
  {/each}
</div>

<style lang="postcss">
  .imageResults {
    @apply grid grid-cols-4 gap-2 content-baseline;
    aspect-ratio: 4 / 3;
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
