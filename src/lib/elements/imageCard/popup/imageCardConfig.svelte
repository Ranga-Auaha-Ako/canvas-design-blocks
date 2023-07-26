<script lang="ts">
  import { get, type Writable } from "svelte/store";
  import { ImageCard } from "../imageCard";
  import {
    DerivedCardTheme,
    ImageCardTheme,
    ValidThemes,
  } from "../imageCardRow";
  import ImageSearch from "$lib/util/components/imageSearch/imageSearch.svelte";
  import { ModalDialog } from "$lib/util/components/modalDialog/modal";
  import { fade } from "svelte/transition";
  import ButtonRadio from "$lib/util/components/buttonRadio.svelte";

  export let props: { imageCard: ImageCard };
  // export let isDominant: Writable<boolean>;
  // export let dominantPopover: Readable<boolean> | undefined = undefined;
  $: imageCard = props.imageCard;
  $: innerText = imageCard.childLabel.innerText;
  $: classes = imageCard.cardRow.classList;
  $: theme = DerivedCardTheme(classes);
  $: cardLink = imageCard.attributes.get("href") as
    | Writable<string>
    | undefined;
  let configEl: HTMLElement;
  let urlInput: HTMLInputElement;

  const openPicker = () => {
    const picker = new ModalDialog(
      ImageSearch,
      imageCard.editor,
      {
        title: "Select Image",
        buttons: [
          {
            type: "cancel",
            text: "Cancel",
          },
        ],
      },
      {},
      imageCard
    );
    const pickerInst = picker.open();
    pickerInst.$on("selectImage", ({ detail }) => {
      imageCard.setImage(detail);
      picker.close();
    });
  };

  const deleteCard = () => {
    imageCard.delete();
  };
  const addCard = () => {
    const newCard = imageCard.cardRow.createCard();
    imageCard.deselect("Popover");
    console.log(newCard);
    newCard.select("Popover");
  };
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
      imageCard.deselectAll();
    }}
  >
    <i class="icon-end" />
  </button>
  <div class="rowTheme">
    <ButtonRadio
      title="Row Theme"
      choices={ValidThemes}
      labels={Object.keys(ImageCardTheme)}
      bind:value={$theme}
    />
  </div>
  <div class="cardSettings">
    <div class="flex gap-x-2 items-baseline">
      <div>
        <label for={`${imageCard.id}-text`}>Card Label:</label>
        <textarea
          class="cardName"
          id={`${imageCard.id}-text`}
          bind:value={$innerText}
          rows="3"
          maxlength="100"
        />
      </div>
      <div>
        <div class="form-group">
          <label class="block" for={`${imageCard.id}-url`}
            >Card Link (URL):</label
          >
          <input
            type="url"
            placeholder="https://canvas.auckland.ac.nz/..."
            id={`${imageCard.id}-url`}
            bind:value={$cardLink}
            on:input={() => urlInput.reportValidity()}
            bind:this={urlInput}
          />
        </div>

        <button class="Button Button--block" on:click={() => openPicker()}
          >Select Image</button
        >
      </div>
    </div>
    <div class="grid grid-cols-2 gap-2">
      <button class="Button Button--danger" on:click={() => deleteCard()}>
        <i class="icon-trash" aria-hidden="true" />
        Remove
      </button>
      <button class="Button" on:click={() => addCard()}>
        <i class="icon-plus" aria-hidden="true" />
        Add Card</button
      >
    </div>
  </div>
</div>

<style lang="postcss">
  .cgb-component {
    @apply bg-white border border-gray-300 rounded p-2 shadow mb-2;
    &:after {
      @apply block absolute rounded mx-auto inset-x-0 w-4 h-4 rotate-45 bottom-0;
      @apply border-b border-r bg-white -z-10;
      content: " ";
    }
    & > .close {
      @apply absolute top-0 right-0 p-1 z-20;
      @apply opacity-100;
      line-height: 0;
      & > i {
        @apply text-gray-600;
        line-height: 0;
      }
    }

    input[type="url"] {
      @apply py-3;
    }
  }
  .cardName {
    @apply w-full border border-gray-300 rounded p-2;
  }
</style>
