<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import ButtonRadio from "../buttonRadio.svelte";
  import ContentSearch from "../contentSearch/contentSearch.svelte";

  const dispatch = createEventDispatcher<{
    save: { link: string; text: string | undefined };
  }>();

  export let link: string;
  export let text: string | undefined = undefined;

  const invalidLink = ["", undefined, "#"];
  $: newLink = invalidLink.some((l) => l === link) ? undefined : link;
  $: newText = text;

  export let dialog: HTMLDialogElement;
  let newLinkLabel: HTMLInputElement;
  let newLinkUrl: HTMLInputElement;

  enum LinkTypes {
    Internal = "Course",
    External = "External",
  }
  let linkType: LinkTypes = LinkTypes.External;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<dialog
  bind:this={dialog}
  on:click={(e) => {
    if (e.target === dialog) dialog.close();
  }}
>
  <div class="dialogBody">
    <h4>Edit Link</h4>
    <ButtonRadio
      title="Link Type"
      choices={Object.values(LinkTypes)}
      labels={Object.values(LinkTypes)}
      bind:value={linkType}
    />
    {#if linkType === LinkTypes.External}
      <div class="form-group">
        <label for="link">Link</label>
        <form
          on:submit|preventDefault|stopPropagation={() => {
            if (
              newLinkUrl.value.startsWith("#") ||
              newLinkUrl.checkValidity()
            ) {
              dispatch("save", { link: newLink || "#", text: newText });
              dialog.close();
            } else {
              newLinkUrl.reportValidity();
            }
            return false;
          }}
        >
          <input
            type="url"
            placeholder="e.g. {document.location.toString()}"
            id="link"
            bind:value={newLink}
            bind:this={newLinkUrl}
          />
          <input type="submit" hidden />
        </form>
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
    {:else}
      <ContentSearch
        on:select={({ detail }) => {
          dispatch("save", { link: detail.url, text: detail.name });
          console.log(detail);
          dialog.close();
        }}
      />
    {/if}
    <div class="actions">
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
      <button
        on:click={() => {
          dialog.close();
        }}
        class="Button cancel">Cancel</button
      >
    </div>
  </div>
</dialog>

<style lang="postcss">
  dialog {
    @apply p-0 rounded-lg shadow-lg w-full max-w-prose;
    .dialogBody {
      @apply p-4;
      @apply grid grid-cols-1 gap-4;
    }
    &::backdrop {
      @apply bg-black bg-opacity-50;
    }
  }
  .actions {
    @apply flex flex-row gap-2;
    justify-content: flex-end;
  }
  .form-group {
    @apply flex flex-col gap-2;
    label {
      @apply p-0 m-0;
    }
    input[type="text"],
    input[type="url"] {
      @apply px-2 py-3 w-full;
    }
  }

  .tabs {
    @apply flex flex-row gap-2;
    .tab {
      @apply border border-gray-300 rounded px-2 py-1 transition text-base;
      &.active {
        @apply bg-gray-200;
      }
    }
  }
</style>
