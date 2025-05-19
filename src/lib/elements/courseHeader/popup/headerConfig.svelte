<script lang="ts">
  import {
    type CourseHeader,
    ValidThemes,
    HeaderTheme,
    ValidLevels,
    HeaderLevel,
  } from "../courseHeader";
  import { fade, slide } from "svelte/transition";
  import ButtonRadio from "$lib/components/buttonRadio.svelte";
  import { ModalDialog } from "$lib/components/modalDialog/modal";
  import ImageSearch from "$lib/components/contentSearch/imageSearch/imageSearch.svelte";
  import OrderableList from "$lib/components/orderableList.svelte";
  import { nanoid } from "nanoid";
  import LinkInput from "$lib/components/contentSearch/linkEditor/linkInput.svelte";
  import writableDerived from "svelte-writable-derived";
  import IconPicker from "$lib/icons/svelte/iconPicker.svelte";
  import { onDestroy } from "svelte";
  import IconElement from "$lib/icons/svelte/iconElement.svelte";
  import ColourPicker from "$lib/components/colourPicker.svelte";
  import { colord } from "colord";

  export let props: { courseHeader: CourseHeader };
  // export let isDominant: Writable<boolean>;
  // export let dominantPopover: Readable<boolean> | undefined = undefined;
  $: courseHeader = props.courseHeader;
  $: headerData = courseHeader.SvelteState;
  export let isModal: boolean = false;
  let configEl: HTMLElement;
  let newLinkText: HTMLInputElement;
  let newLinkTextLabel: HTMLInputElement;
  let newLinkTextUrl: HTMLInputElement;

  let previousTheme = $headerData ? $headerData.theme : HeaderTheme.Modern;

  // Keep the existing reactive statement to track changes
  $: {
    if ($headerData && $headerData.theme !== previousTheme) {
      previousTheme = $headerData.theme;
    }
  }

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

  $: isReadable =
  !$headerData.backgroundColor ||
  ($headerData.backgroundColor?.isDark()
    ? $headerData.backgroundColor.isReadable("#fff", { level: "AAA" })
    : $headerData.backgroundColor?.isReadable("#000", { level: "AAA" }));

  const headerIconPicker = new IconPicker({
    target: document.body,
    props: {
      options: { editColor: true },
    },
  });
  headerIconPicker.$on("selectIcon", ({ detail }) => {
    headerIconPicker.close();
    $headerData.icon = {
      id: detail.icon.i,
      color: detail.color,
      type: detail.type,
    };
  });
  onDestroy(() => {
    headerIconPicker.$destroy();
  });

  const buttonIconPicker = new IconPicker({
    target: document.body,
    props: {
      options: { editColor: false },
    },
  });
  buttonIconPicker.$on("selectIcon", ({ detail }) => {
    buttonIconPicker.close();
    if (editLinkIndex === undefined || !$headerData.links[editLinkIndex])
      return;
    $headerData.links[editLinkIndex].icon = {
      id: detail.icon.i,
      type: detail.type,
    };
  });
  onDestroy(() => {
    buttonIconPicker.$destroy();
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
      on:change={() => {
        // Only clear background color when changing FROM Modern to another theme
        if ($headerData.theme !== HeaderTheme.Modern &&
            previousTheme === HeaderTheme.Modern &&
            $headerData.backgroundColor) {
          $headerData.backgroundColor = undefined;
        }
        // When changing TO Modern theme, preserve text color if possible
        else if ($headerData.theme === HeaderTheme.Modern &&
                 previousTheme !== HeaderTheme.Modern) {
          // Keep any existing styles
        }
      }}
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
    <div class="flex gap-2">
      <button class="Button Button--block Button--small" on:click={openPicker}>
        <i class="cdb--icon" aria-hidden="true"> Canvas.image </i>

        Select image</button
      >
      {#if $headerData.image}
        <button
          class="Button Button--small aspect-square mt-0 grow-0"
          title="Remove image"
          on:click={() => {
            $headerData.image = "";
          }}
        >
          <i class="cdb--icon" aria-hidden="true"> Canvas.x </i>
        </button>
      {/if}
    </div>
    {#if $headerData.theme === HeaderTheme["Modern"]}
      <div class="flex gap-2">
        <button
          class="Button Button--small mt-0 grow"
          on:click={() => {
            headerIconPicker.open();
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
      <ColourPicker
        label="Background Colour"
        id={nanoid() + "-setting-background"}
        bind:colour={$headerData.backgroundColor}
        contrastColour={"Light/Dark"}
        style={"wide"}
        showNone={true}
        asModal={isModal}
      />
      {#if !isReadable}
        <div class="colour-alert" transition:slide|global>
          <p class="alert-details">
            <span class="font-bold">Warning:</span> The text in this button may
            be hard to read for some students. {#if $headerData.backgroundColor?.isLight()}
              Consider using a darker colour to improve contrast against the
              light text.
            {:else}
              Consider using a lighter colour to improve contrast against the
              dark text.
            {/if}
          </p>
        </div>
      {/if}
    {/if}
  </div>
  <div class="col">
    <!-- Links -->
    {#if editLinkIndex !== undefined}
      {@const icon = $headerData.links[editLinkIndex].icon}
      <div class="editLink">
        <div class="editActions">
          <button
            title="Finish editing link"
            on:click|stopPropagation={() => {
              editLinkId = undefined;
            }}
          >
            Done
            <i class="icon-solid icon-check pl-1" aria-hidden="true" />
          </button>
        </div>
        <div class="linkOptions">
          <label for="linkTitle-{editLinkId}">Title</label>
          {#if $headerData.theme === HeaderTheme.Modern}
            <textarea
              id="linkTitle-{editLinkId}"
              bind:value={$headerData.links[editLinkIndex].title}
              rows={$headerData.links[editLinkIndex].title.split("\n").length >
              1
                ? 2
                : 1}
              on:input={(e) => {
                // Limit the number of lines to 2
                if (!e.target) return;
                //@ts-ignore
                if (e.target.value.split("\n").length > 2) {
                  //@ts-ignore
                  e.target.value = e.target.value
                    .split("\n")
                    .slice(0, 2)
                    .join("\n");
                }
              }}
            ></textarea>
          {:else}
            <input
              id="linkTitle-{editLinkId}"
              bind:value={$headerData.links[editLinkIndex].title}
              type="text"
            />
          {/if}
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

          <!-- Icon Picker for button -->
          <div class="flex gap-2 mt-2">
            <button
              class="Button Button--small mt-0 grow"
              on:click={() => {
                buttonIconPicker.open();
              }}
            >
              {#if !icon}
                <i class="cdb--icon" aria-hidden="true">
                  Canvas.button-and-icon-maker
                </i>
              {:else}
                <IconElement {icon} colorOverride="#000" />
              {/if}

              Select Icon
            </button>
            {#if $headerData.links[editLinkIndex].icon}
              <button
                class="Button Button--small aspect-square mt-0 grow-0"
                title="Remove icon"
                on:click={() => {
                  $headerData.links[editLinkIndex].icon = undefined;
                }}
              >
                <i class="cdb--icon" aria-hidden="true"> Canvas.x </i>
              </button>
            {/if}
          </div>

          <!-- Select box for opening in new tab -->
          <label for="newTab" class="checkbox mt-2">
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

  .colour-alert {
    @apply border-l-4 border-orange-300 bg-orange-100 text-orange-900 p-2 rounded transition text-xs;
    p {
      @apply m-0;
    }
  }
</style>
