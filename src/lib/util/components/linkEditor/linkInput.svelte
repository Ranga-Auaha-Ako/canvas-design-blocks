<script lang="ts">
  import LinkDialog from "./linkDialog.svelte";
  const invalidLink = ["", undefined, "#"];

  export let link: string;
  export let text: string | undefined = undefined;
  export let id: string | undefined = undefined;
  let dialog: HTMLDialogElement;
</script>

<button
  class="editLink"
  {id}
  on:click={() => {
    dialog.showModal();
  }}
  title="Edit Link"
>
  {#if invalidLink.includes(link)}
    <span class="text-black text-opacity-50">Insert Link...</span>
  {:else}
    {link}
  {/if}
</button>

<LinkDialog bind:dialog {link} {text} on:save />

<style lang="postcss">
  .editLink {
    @apply truncate max-w-xs w-full text-left;
    @apply border border-gray-300 rounded px-2 p-1 mb-1;
  }
</style>
