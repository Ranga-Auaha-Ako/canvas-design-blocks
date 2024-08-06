<script lang="ts">
  import Portal from "$lib/portal/portal.svelte";
  import { onMount } from "svelte";
  import { persisted } from "svelte-persisted-store";
  import { slide } from "svelte/transition";
  import isMobile from "is-mobile";

  const showSandpitNotice = persisted("cdb-show-sandpit-notice", true, {
    storage: "session",
    syncTabs: true,
  });

  let sandpitDialog: HTMLDialogElement;

  $: if (sandpitDialog)
    if (!$showSandpitNotice) {
      sandpitDialog.close();
    } else {
      sandpitDialog.showModal();
    }
</script>

<dialog
  class="sandpit-notice"
  transition:slide
  bind:this={sandpitDialog}
  class:mobile-notice={isMobile()}
>
  <h1>Welcome to the Canvas Design Blocks Sandpit!</h1>
  {#if isMobile()}
    <div class="callout">
      <strong>Warning!</strong> This sandpit is not designed for mobile devices.
      Please use a desktop or laptop computer to access the full functionality.
      Use this link to access the sandpit on a desktop:

      <pre class="text-center" style:user-select="all">{window.location
          .href}</pre>
      {#if navigator.share}
        <button
          class="Button"
          on:click={() => {
            navigator.share({
              title: "Canvas Design Blocks Sandpit",
              text: "Open this link on a desktop to access the Canvas Design Blocks Sandpit",
              url: window.location.href,
            });
          }}
        >
          Share Link
        </button>
      {/if}
    </div>
  {/if}
  <p>
    This sandpit simulates a canvas environment, without the need for installing
    the theme into a live Canvas site. It is designed to allow you to test and
    experiment with the various components and features of the tool. You can
    add, edit, and delete elements, and see how they interact with each other.
  </p>
  {#if !isMobile()}
    <p>
      To the side of this page (where you would normally see the main Canvas
      menu), you can choose to view any single block on its own.
    </p>

    <div class="callout">
      <strong>Important!</strong> This is a sandbox environment and is not connected
      to any live Canvas site. Any changes you make here will not be saved, and you
      will not be able to use the content search feature for links.
    </div>

    <p>
      If you would like to see this message again, you can click the "Show Info"
      button in the top right corner of the page.
    </p>
    <button class="Button" on:click={() => showSandpitNotice.set(false)}
      >Got it! Hide till next session.</button
    >
  {/if}
</dialog>
{#if !$showSandpitNotice}
  <Portal target=".right-of-crumbs">
    <button class="Button" on:click={() => showSandpitNotice.set(true)}>
      Show Info
    </button>
  </Portal>
{/if}

<style lang="postcss">
  .sandpit-notice {
    @apply max-w-prose mx-auto rounded-lg shadow-strong p-8 bg-white border-primary border-t-2 border-0 transition;
    &.mobile-notice {
      @apply h-screen;
    }

    &::backdrop {
      @apply bg-black bg-opacity-75 transition;
    }
    h1 {
      @apply text-center;
    }
    .Button {
      @apply mt-4 mx-auto block;
    }
  }
  .callout {
    @apply bg-yellow-100 border-yellow-300 border-solid border px-4 py-2 rounded-lg;
    strong {
      @apply block;
    }
  }
  .Button {
    @apply bg-yellow-100 border-yellow-300 transition;
    &:hover {
      @apply bg-yellow-200;
    }
    &:active,
    &:focus {
      @apply bg-yellow-300 border-0 ring ring-1 ring-yellow-400;
    }
  }
</style>
