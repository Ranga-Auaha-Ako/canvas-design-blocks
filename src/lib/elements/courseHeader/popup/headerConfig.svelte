<script lang="ts">
  import {
    type CourseHeader,
    ValidThemes,
    HeaderTheme,
    ValidLevels,
    HeaderLevel,
  } from "../courseHeader";
  import { fade } from "svelte/transition";
  import ButtonRadio from "$lib/util/components/buttonRadio.svelte";
  import { ModalDialog } from "$lib/util/components/modalDialog/modal";
  import ImageSearch from "$lib/util/components/contentSearch/imageSearch/imageSearch.svelte";
  import OrderableList from "$lib/util/components/orderableList.svelte";
  import { nanoid } from "nanoid";
  import LinkInput from "$lib/util/components/contentSearch/linkEditor/linkInput.svelte";
  import writableDerived from "svelte-writable-derived";
  import IconPicker from "$lib/icons/svelte/iconPicker.svelte";
  import { onDestroy } from "svelte";
  import IconElement from "$lib/icons/svelte/iconElement.svelte";

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

  $: isNewTab = writableDerived(
    headerData,
    ($headerData) => {
      return $headerData.links.map((l) => l.target !== "_self");
    },
    (reflecting, $headerData) => {
      $headerData.links = $headerData.links.map((l, i) => {
        if (!reflecting[i]) {
          l.target = "_self";
        }
        if (reflecting[i] && l.target !== "_blank") {
          l.target = "_blank";
        }
        return l;
      });
      return $headerData;
    }
  );

  const iconPicker = new IconPicker({
    target: document.body,
    props: {
      options: { editColor: true },
    },
  });
  iconPicker.$on("selectIcon", ({ detail }) => {
    iconPicker.close();
    $headerData.icon = {
      id: detail.icon.i,
      color: detail.color,
      type: detail.type,
    };
  });
  onDestroy(() => {
    iconPicker.$destroy();
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={configEl}
  class="cgb-component"
  in:fade|global={{ duration: 200 }}
>
  <button
    class="close"
    title="Close"
    on:click={() => {
      courseHeader.deselectAll();
    }}
  >
    <i class="icon-end" />
  </button>
  <div class="col">
    <div>
      <ButtonRadio
        title="Header Theme"
        choices={ValidThemes}
        labels={Object.keys(HeaderTheme)}
        bind:value={$headerData.theme}
      />
    </div>
    <div>
      <ButtonRadio
        title="Header Level"
        choices={ValidLevels}
        labels={Object.keys(HeaderLevel)}
        bind:value={$headerData.level}
      />
    </div>
    <button class="Button Button--block Button--small" on:click={openPicker}>
      <i class="cdb--icon" aria-hidden="true"> Canvas.image </i>

      Select image</button
    >
    {#if $headerData.theme === HeaderTheme["Modern"]}
      <div class="flex gap-2">
        <button
          class="Button Button--small mt-0 grow"
          on:click={() => {
            iconPicker.open();
          }}
        >
          {#if !$headerData.icon}
            <i class="cdb--icon" aria-hidden="true">
              Canvas.button-and-icon-maker
            </i>
          {:else}
            <IconElement icon={$headerData.icon} colorOverride="#000" />
          {/if}

          Select Icon
        </button>
        {#if $headerData.icon}
          <button
            class="Button Button--small aspect-square mt-0 grow-0"
            title="Remove icon"
            on:click={() => {
              $headerData.icon = undefined;
            }}
          >
            <i class="cdb--icon" aria-hidden="true"> Canvas.x </i>
          </button>
        {/if}
      </div>
    {/if}
  </div>
  <div class="col">
    <!-- Links -->
    {#if editLinkIndex !== undefined}
      <div class="editLink">
        <div class="editActions">
          <button
            title="Finish editing link"
            on:click={() => {
              editLinkId = undefined;
            }}
          >
            Done
            <i class="icon-solid icon-check pl-1" aria-hidden="true" />
          </button>
        </div>
        <div class="linkOptions">
          <label for="linkTitle-{editLinkId}">Title</label>
          <input
            type="text"
            id="linkTitle-{editLinkId}"
            bind:value={$headerData.links[editLinkIndex].title}
          />
          <label for="linkUrl-{editLinkId}">URL</label>
          <LinkInput
            id="linkUrl-{editLinkId}"
            link={$headerData.links[editLinkIndex].url}
            text={$headerData.links[editLinkIndex].title}
            on:save={({ detail }) => {
              if (editLinkIndex === undefined) return;
              $headerData.links[editLinkIndex].url = detail.link;
              if (detail.text !== undefined)
                $headerData.links[editLinkIndex].title = detail.text;
            }}
          />

          <!-- Select box for opening in new tab -->
          <label for="newTab" class="checkbox">
            <input
              type="checkbox"
              id="newTab"
              bind:checked={$isNewTab[editLinkIndex]}
            />
            Open in new tab
          </label>
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
    @apply bg-white border border-gray-300 rounded pt-6 p-2 shadow mb-2;
    @apply grid grid-cols-2 max-w-lg w-screen gap-4;
    &:after {
      @apply block absolute rounded mx-auto inset-x-0 w-4 h-4 rotate-45 bottom-0;
      @apply border-b border-r bg-white -z-10;
      content: " ";
    }
    & > .close {
      @apply absolute top-0 right-0 p-1 z-20;
      @apply opacity-100;
      line-height: 0;
      i {
        @apply text-gray-600;
        line-height: 0;
      }
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

  .checkbox {
    @apply flex items-center gap-2;
    @apply text-gray-500;
    @apply cursor-pointer;
    @apply accent-primary;
    & input {
      @apply w-4 h-4;
    }
  }
</style>
