<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import ButtonRadio from "../../buttonRadio.svelte";
  import ContentSearch from "../contentSearch.svelte";
  import Modal from "../../modalDialog/modal.svelte";
  import { persisted } from "svelte-persisted-store";
  import type { Writable } from "svelte/store";

  const dispatch = createEventDispatcher<{
    save: { link: string; text: string | undefined };
  }>();

  export let link: string;
  export let text: string | undefined = undefined;

  const invalidLink = ["", undefined, "#"];
  $: newLink = invalidLink.some((l) => l === link) ? undefined : link;
  $: newText = text;

  export let dialog: Modal;
  let newLinkLabel: HTMLInputElement;
  let newLinkUrl: HTMLInputElement;

  enum LinkTypes {
    Internal = "Course",
    External = "External",
  }
  const linkType: Writable<LinkTypes> = persisted(
    "cdb-linktype-dialog",
    LinkTypes.External
  );
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<Modal title="Edit Link" bind:this={dialog}>
  <div class="tabs-header" role="tablist">
    <button
      role="tab"
      aria-selected={$linkType === LinkTypes.External}
      class="tab"
      class:active={$linkType === LinkTypes.Internal}
      on:click={() => {
        $linkType = LinkTypes.Internal;
      }}>Course Links</button
    >
    <button
      role="tab"
      aria-selected={$linkType === LinkTypes.External}
      class="tab"
      class:active={$linkType === LinkTypes.External}
      on:click={() => {
        $linkType = LinkTypes.External;
      }}>External Links</button
    >
  </div>
  {#if $linkType === LinkTypes.External}
    <form
      on:submit|preventDefault|stopPropagation={() => {
        if (newLinkUrl.value.startsWith("#") || newLinkUrl.checkValidity()) {
          dispatch("save", { link: newLink || "#", text: newText });
          dialog.close();
        } else {
          newLinkUrl.reportValidity();
        }
        return false;
      }}
    >
      <div class="form-group">
        <label for="link">Link</label>
        <input
          type="url"
          placeholder="e.g. {document.location.toString()}"
          id="link"
          bind:value={newLink}
          bind:this={newLinkUrl}
        />
        <input type="submit" hidden />
      </div>
      {#if text !== undefined}
        <div class="form-group">
          <label for="text">Label</label>
          <input
            type="text"
            id="text"
            bind:value={newText}
            bind:this={newLinkLabel}
          />
        </div>
      {/if}
    </form>
  {:else}
    <ContentSearch
      on:select={({ detail }) => {
        dispatch("save", { link: detail.url, text: detail.name });
        dialog.close();
      }}
    />
  {/if}
  <div slot="actions">
    {#if $linkType === LinkTypes.External}
      <button
        on:click={() => {
          if (newLinkUrl.value.startsWith("#") || newLinkUrl.checkValidity()) {
            dispatch("save", { link: newLink || "#", text: newText });
            dialog.close();
          } else {
            newLinkUrl.reportValidity();
          }
        }}
        class="Button Button--success save">Save</button
      >
    {/if}
    <button
      on:click={() => {
        dialog.close();
      }}
      class="Button cancel">Cancel</button
    >
  </div>
</Modal>

<style lang="postcss">
  .tabs-header {
    @apply flex flex-row gap-1 w-full border-b border-gray-300 transition;
    .tab {
      @apply grow flex-1;
      @apply border border-gray-300 border-b-white rounded-t px-2 py-2 border-opacity-0 transition duration-300;
      @apply text-base text-blue-600;
      margin-bottom: -1px;
      &.active {
        @apply border-gray-300 border-b-white bg-white text-black;
      }
      &:hover {
        @apply border-opacity-50 bg-black bg-opacity-5;
      }
    }
  }
  .form-group {
    @apply flex flex-col gap-2;
    label {
      @apply p-0 m-0;
    }
    input[type="text"],
    input[type="url"] {
      @apply px-2 py-3 w-full h-8;
    }
  }
</style>
