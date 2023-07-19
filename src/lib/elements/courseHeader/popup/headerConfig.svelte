<script lang="ts">
  import { type CourseHeader, ValidThemes, HeaderTheme } from "../courseHeader";
  import { fade } from "svelte/transition";
  import ButtonRadio from "$lib/util/components/buttonRadio.svelte";
  import { ModalDialog } from "$lib/util/components/modalDialog/modal";
  import ImageSearch from "$lib/util/components/imageSearch/imageSearch.svelte";
  import OrderableList from "$lib/util/components/orderableList.svelte";
  import { nanoid } from "nanoid";

  export let props: { courseHeader: CourseHeader };
  // export let isDominant: Writable<boolean>;
  // export let dominantPopover: Readable<boolean> | undefined = undefined;
  $: courseHeader = props.courseHeader;
  $: headerData = courseHeader.SvelteState;
  let configEl: HTMLElement;
  let newLinkText: HTMLInputElement;
  let newLinkTextLabel: HTMLInputElement;
  let newLinkTextUrl: HTMLInputElement;

  const openPicker = () => {
    const picker = new ModalDialog(
      ImageSearch,
      courseHeader.editor,
      {
        title: "Select Image",
        buttons: [
          {
            type: "cancel",
            text: "Cancel",
          },
        ],
      },
      {}
    );
    const pickerInst = picker.open();
    pickerInst.$on("selectImage", ({ detail: url }) => {
      $headerData.image = url;
      picker.close();
    });
  };
  let requireLinkText: boolean = false;
  const addLink = () => {
    if (!newLinkText.value) {
      requireLinkText = true;
      return;
    }
    $headerData.links = [
      ...$headerData.links,
      {
        id: nanoid(),
        title: newLinkText?.value,
        url: "#",
      },
    ];
    newLinkText.value = "";
    requireLinkText = false;
  };

  let editLinkId: string | undefined;
  $: editLinkIndex = editLinkId
    ? $headerData.links.findIndex((l) => l.id === editLinkId)
    : undefined;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={configEl}
  class="cgb-component"
  in:fade|global={{ duration: 200 }}
>
  <div class="col">
    <div>
      <ButtonRadio
        title="Header Theme"
        choices={ValidThemes}
        labels={Object.keys(HeaderTheme)}
        bind:value={$headerData.theme}
      />
    </div>
    <button class="Button" on:click={openPicker}>Select image</button>
  </div>
  <div class="col">
    <!-- Links -->
    {#if editLinkIndex !== undefined}
      <div class="editLink">
        <div class="editActions">
          <button
            title="Finish editing link"
            on:click={() => {
              if (
                newLinkTextUrl.checkValidity() &&
                newLinkTextLabel.value.length > 0
              ) {
                editLinkId = undefined;
                newLinkTextLabel.removeAttribute("required");
              } else {
                newLinkTextUrl.reportValidity();
                newLinkTextLabel.setAttribute("required", "");
              }
            }}
          >
            Save
            <i class="icon-solid icon-check pl-1" aria-hidden="true" />
          </button>
        </div>
        <div class="linkOptions">
          <label for="linkTitle-{editLinkId}">Title</label>
          <input
            type="text"
            id="linkTitle-{editLinkId}"
            bind:value={$headerData.links[editLinkIndex].title}
            bind:this={newLinkTextLabel}
          />
          <label for="linkUrl-{editLinkId}">URL</label>
          <input
            type="url"
            id="linkUrl-{editLinkId}"
            bind:value={$headerData.links[editLinkIndex].url}
            bind:this={newLinkTextUrl}
          />
        </div>
      </div>
    {:else}
      <div class="manageLinks">
        <div class="manageActions">
          <input
            bind:this={newLinkText}
            on:keydown={(e) => {
              if (e.key === "Enter") addLink();
            }}
            required={requireLinkText}
            type="text"
            placeholder="Link title..."
          />
          <button
            class="Button Button--small"
            on:click={addLink}
            title="Add link"
          >
            <i class="icon-plus" aria-hidden="true" />
          </button>
        </div>
        <div class="linkList">
          <OrderableList
            labelKey="title"
            idKey="id"
            showEdit={true}
            on:edit={(e) => {
              editLinkId = e.detail;
            }}
            bind:items={$headerData.links}
          />
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  .cgb-component {
    @apply bg-white border border-gray-300 rounded p-2 shadow mb-2;
    @apply grid grid-cols-2 max-w-lg w-screen gap-4;
    &:after {
      @apply block absolute rounded mx-auto inset-x-0 w-4 h-4 rotate-45 bottom-0;
      @apply border-b border-r bg-white -z-10;
      content: " ";
    }
    .col {
      @apply flex flex-col gap-2;
    }
    .editLink,
    .manageLinks {
      @apply rounded border border-gray-300 overflow-clip;
      .editActions,
      .manageActions {
        @apply flex gap-2 justify-end;
        @apply bg-gray-100 border-b p-1 px-2;
      }
      & .manageActions {
        input {
          @apply m-0;
          min-width: 14ch;
        }
        button {
          @apply py-1;
        }
      }
      & .linkOptions {
        @apply pt-2 px-2;
      }
      & .linkList {
        @apply p-2 max-h-60 overflow-y-auto;
      }
      & input,
      & label {
        @apply block;
      }
      & input {
        @apply p-4;
      }
    }
  }
</style>
