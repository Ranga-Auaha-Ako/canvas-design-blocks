<script lang="ts">
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  let display = false;
  onMount(() => {
    display = true;
  });

  let dialog: HTMLDialogElement;
</script>

{#if display}
  <div class="cgb-component">
    <div class="announcement" in:slide|global>
      <p class="font-bold">Canvas Design Blocks</p>
      <p class="text-xs">
        You have the old version of Canvas Design Blocks installed! This tool is
        now integrated into Canvas, and you should uninstall the browser
        extension.
        <a
          class="Button Button--small text-black uninstall-btn box-border"
          href="https://chrome.google.com/webstore/detail/canvas-design-blocks/pigilebjadbgcmklbgndfpckcgibedla"
          target="_blank"
          rel="noreferrer"
          on:click={() => {
            dialog.showModal();
          }}
        >
          Uninstall Now
        </a>
        You do not need to do anything to get the new version of Canvas Design Blocks,
        it will be automatically installed when you next open Canvas.
      </p>
    </div>
    <dialog bind:this={dialog} class="cdb-dialog-done">
      <h3>Thanks for doing that!</h3>
      <p>
        Uninstalling the chrome extension is required to make sure you're using
        the same version as everyone else. Not sure it's uninstalled?
      </p>
      <ul>
        <li>
          <strong>Step 1:</strong> Visit this page:
          <a
            href="https://chrome.google.com/webstore/detail/canvas-design-blocks/pigilebjadbgcmklbgndfpckcgibedla"
            target="_blank"
            rel="noreferrer"
            class="text-blue-500 underline"
          >
            https://chrome.google.com/webstore/detail/canvas-design-blocks/pigilebjadbgcmklbgndfpckcgibedla
          </a>
        </li>
        <li><strong>Step 2:</strong> Click the "Remove from Chrome" button.</li>
        <li>
          <strong>Step 3:</strong> Refresh Canvas and you're good to go! 🎉
        </li>
      </ul>
      <button
        class="Button Button--success Button--large close-btn"
        on:click={() => {
          dialog.close();
          window.location.reload();
        }}
      >
        <i class="icon-solid icon-check" />
        Close
      </button>
    </dialog>
  </div>
{/if}

<style lang="postcss">
  .cdb-dialog-done {
    @apply bg-white rounded p-4 shadow-lg max-w-prose;
    & h3 {
      @apply text-2xl font-bold mb-2;
    }
    &::backdrop {
      @apply bg-black bg-opacity-20;
    }
    & p {
      @apply mb-2;
    }
    & ul {
      @apply list-disc list-outside mx-10;
      & li {
        @apply mt-2;
      }
    }
    & .close-btn {
      @apply mt-4 mx-auto block;
    }
  }
  .announcement {
    @apply px-3 py-2 bg-red-800 text-white transition-colors border rounded mb-2 overflow-clip text-sm;
    min-height: 50vh;
  }
  .uninstall-btn {
    @apply bg-white w-full my-2;
  }
  :root:global(.cgb-toolbar) {
    opacity: 0.3 !important;
    pointer-events: none !important;
  }
</style>
